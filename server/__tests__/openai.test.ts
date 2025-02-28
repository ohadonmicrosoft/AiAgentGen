import {
  generateResponse,
  generateStreamingResponse,
  testAgentResponse,
} from '../openai';

// Mock the storage module
jest.mock('../storage', () => ({
  getApiKey: jest.fn(),
  createMessage: jest.fn(),
}));

// Mock the OpenAI SDK
jest.mock('openai', () => {
  // Create a mock OpenAI client object
  const mockCompletionsCreate = jest.fn();
  const mockStreamingCompletionsCreate = jest.fn();

  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: (options: any) => {
            if (options.stream) {
              return mockStreamingCompletionsCreate(options);
            } else {
              return mockCompletionsCreate(options);
            }
          },
        },
      },
    })),
    _mockCompletionsCreate: mockCompletionsCreate,
    _mockStreamingCompletionsCreate: mockStreamingCompletionsCreate,
  };
});

// Mock console methods to avoid polluting test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Get mocks
const openaiModule = require('openai');
const storage = require('../storage');

describe('OpenAI Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    storage.getApiKey.mockResolvedValue('mock-api-key');
  });

  describe('generateResponse', () => {
    it('should generate a response using the OpenAI API', async () => {
      // Setup mock response from OpenAI
      openaiModule._mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Mock response from OpenAI' } }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      });

      // Call the function
      const result = await generateResponse('System prompt', 'User prompt');

      // Check the result
      expect(result).toEqual({
        content: 'Mock response from OpenAI',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
        isMock: false,
      });

      // Verify OpenAI was called with correct parameters
      expect(openaiModule._mockCompletionsCreate).toHaveBeenCalledWith({
        model: 'gpt-4o', // Default model
        messages: [
          { role: 'system', content: 'System prompt' },
          { role: 'user', content: 'User prompt' },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should use custom parameters when provided', async () => {
      // Setup mock response
      openaiModule._mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Custom response' } }],
        usage: {
          prompt_tokens: 8,
          completion_tokens: 3,
          total_tokens: 11,
        },
      });

      // Call with custom parameters
      await generateResponse('System', 'User', {
        model: 'gpt-3.5-turbo',
        temperature: 0.9,
        maxTokens: 500,
        userId: 123,
        agentId: 456,
      });

      // Verify parameters were passed correctly
      expect(storage.getApiKey).toHaveBeenCalledWith(123);
      expect(openaiModule._mockCompletionsCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'System' },
          { role: 'user', content: 'User' },
        ],
        temperature: 0.9,
        max_tokens: 500,
      });
    });

    it('should handle API errors gracefully', async () => {
      // Setup error response
      const apiError = new Error('API Error');
      apiError.response = {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      };
      openaiModule._mockCompletionsCreate.mockRejectedValueOnce(apiError);

      // Expect error to be thrown
      await expect(generateResponse('System', 'User')).rejects.toThrow(
        'OpenAI API rate limit exceeded. Please try again later.',
      );
    });
  });

  describe('generateStreamingResponse', () => {
    it('should stream responses from OpenAI', async () => {
      // Mock stream of chunks
      const mockStream = [
        { choices: [{ delta: { content: 'Hello' } }] },
        { choices: [{ delta: { content: ' world' } }] },
        { choices: [{ delta: { content: '!' } }] },
      ];

      // Make the mock stream iterable with async iterator
      mockStream[Symbol.asyncIterator] = async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      };

      openaiModule._mockStreamingCompletionsCreate.mockResolvedValueOnce(
        mockStream,
      );

      // Collect all yielded values
      const generator = generateStreamingResponse(
        'System prompt',
        'User prompt',
      );
      const results = [];

      for await (const chunk of generator) {
        results.push(chunk);
      }

      // Check first chunks have content
      expect(results[0]).toEqual({ content: 'Hello', done: false });
      expect(results[1]).toEqual({ content: ' world', done: false });
      expect(results[2]).toEqual({ content: '!', done: false });

      // Last chunk should indicate completion
      expect(results[3].done).toBe(true);
      expect(results[3].timing).toBeDefined();

      // Check OpenAI was called correctly
      expect(openaiModule._mockStreamingCompletionsCreate).toHaveBeenCalledWith(
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'System prompt' },
            { role: 'user', content: 'User prompt' },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          stream: true,
        },
      );
    });

    it('should save to conversation history when IDs are provided', async () => {
      // Simple mock stream with one chunk
      const mockStream = [{ choices: [{ delta: { content: 'Response' } }] }];
      mockStream[Symbol.asyncIterator] = async function* () {
        for (const chunk of mockStream) {
          yield chunk;
        }
      };

      openaiModule._mockStreamingCompletionsCreate.mockResolvedValueOnce(
        mockStream,
      );

      // Call with conversation IDs
      const generator = generateStreamingResponse('System', 'User', {
        userId: 123,
        agentId: 456,
        conversationId: 789,
      });

      // Exhaust the generator
      for await (const _ of generator) {
        // Just consume the chunks
      }

      // Verify conversation history was saved
      expect(storage.createMessage).toHaveBeenCalledWith({
        conversationId: 789,
        role: 'assistant',
        content: 'Response',
        tokenCount: expect.any(Number),
      });
    });

    it('should handle streaming errors', async () => {
      // Setup error during streaming
      openaiModule._mockStreamingCompletionsCreate.mockRejectedValueOnce(
        new Error('Streaming error'),
      );

      // Call the generator
      const generator = generateStreamingResponse('System', 'User');

      // First (and only) chunk should contain error info
      const firstChunk = await generator.next();
      expect(firstChunk.value).toEqual({
        content: '',
        error: 'Streaming error',
        done: true,
      });

      // The generator should complete after yielding the error
      const secondChunk = await generator.next();
      expect(secondChunk.done).toBe(true);
    });
  });

  describe('testAgentResponse', () => {
    it('should test an agent with a user message', async () => {
      // Setup mock response
      openaiModule._mockCompletionsCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Agent response' } }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 6,
          total_tokens: 18,
        },
      });

      // Mock agent object
      const agent = {
        id: 123,
        systemPrompt: 'You are a helpful assistant',
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 2000,
      };

      // Test the agent
      const result = await testAgentResponse(agent, 'Hello agent', 456);

      // Check result
      expect(result.content).toBe('Agent response');

      // Verify generateResponse was called with agent parameters
      expect(openaiModule._mockCompletionsCreate).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello agent' },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });
    });

    it('should throw an error if agent has no system prompt', async () => {
      const invalidAgent = {
        id: 123,
        // No systemPrompt
      };

      await expect(testAgentResponse(invalidAgent, 'Hello')).rejects.toThrow(
        'Agent system prompt is required',
      );
    });
  });
});
