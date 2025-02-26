import OpenAI from 'openai';
import { log } from './vite';
import { storage } from './storage';

// Initialize OpenAI client
const createOpenAIClient = (apiKey?: string) => {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY
  });
};

// Store token usage for analytics and rate limiting
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: Date;
  userId?: number;
  agentId?: number;
}

// In-memory token usage storage
// In a production environment, this would be stored in a database
const tokenUsageLog: TokenUsage[] = [];

/**
 * Track token usage for analytics and rate limiting
 */
export function trackTokenUsage(usage: TokenUsage) {
  tokenUsageLog.push({
    ...usage,
    timestamp: usage.timestamp || new Date()
  });
  
  // Log usage
  log(`Token usage: ${usage.totalTokens} tokens (${usage.promptTokens} prompt, ${usage.completionTokens} completion)`, 'openai');
  if (usage.userId) {
    log(`User ID: ${usage.userId}`, 'openai');
  }
  if (usage.agentId) {
    log(`Agent ID: ${usage.agentId}`, 'openai');
  }
}

/**
 * Get token usage statistics for a specific user or globally
 */
export function getTokenUsage(options?: { userId?: number; timeframe?: 'day' | 'week' | 'month' | 'all' }) {
  const { userId, timeframe = 'all' } = options || {};
  
  // Filter by user if specified
  let filteredUsage = userId
    ? tokenUsageLog.filter(usage => usage.userId === userId)
    : tokenUsageLog;
  
  // Filter by timeframe
  if (timeframe !== 'all') {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }
    
    filteredUsage = filteredUsage.filter(usage => usage.timestamp >= cutoff);
  }
  
  // Calculate total usage
  const totalUsage = filteredUsage.reduce(
    (acc, usage) => {
      acc.promptTokens += usage.promptTokens;
      acc.completionTokens += usage.completionTokens;
      acc.totalTokens += usage.totalTokens;
      return acc;
    },
    { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  );
  
  return totalUsage;
}

/**
 * Process and validate system and user prompts
 */
function processPrompts(systemPrompt: string, userPrompt: string) {
  // Validate prompts
  if (!systemPrompt) {
    throw new Error('System prompt is required');
  }
  
  if (!userPrompt) {
    throw new Error('User prompt is required');
  }
  
  // Trim prompts to remove whitespace
  const processedSystemPrompt = systemPrompt.trim();
  const processedUserPrompt = userPrompt.trim();
  
  return {
    systemPrompt: processedSystemPrompt,
    userPrompt: processedUserPrompt
  };
}

/**
 * Enhanced OpenAI API error handling
 */
function handleOpenAIError(error: any): never {
  // Extract the most useful error information
  let errorMessage = 'An error occurred when calling OpenAI API';
  
  if (error.response) {
    // API error with response
    const status = error.response.status;
    const data = error.response.data;
    
    if (status === 401) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key.';
    } else if (status === 429) {
      errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
    } else if (status === 500) {
      errorMessage = 'OpenAI API server error. Please try again later.';
    } else {
      errorMessage = `OpenAI API error: ${data?.error?.message || 'Unknown error'}`;
    }
  } else if (error.message) {
    // Error with message
    errorMessage = error.message;
  }
  
  // Log error with detailed information
  log(`OpenAI API error: ${errorMessage}`, 'openai');
  
  // Throw a simplified error for the client
  throw new Error(errorMessage);
}

/**
 * Generate a response using OpenAI API with retry logic and enhanced error handling
 */
export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: string | number;
    maxTokens?: string | number;
    userId?: number;
    agentId?: number;
  } = {}
) {
  const {
    model = 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    temperature = 0.7,
    maxTokens = 1000,
    userId,
    agentId
  } = options;
  
  // Get user-specific API key if a userId is provided
  let apiKey: string | null = null;
  if (userId) {
    apiKey = await storage.getApiKey(userId);
  }
  
  // Create OpenAI client with the appropriate API key
  const openai = createOpenAIClient(apiKey || undefined);
  
  try {
    // Process and validate prompts
    const { systemPrompt: processedSystemPrompt, userPrompt: processedUserPrompt } = 
      processPrompts(systemPrompt, userPrompt);
    
    // Call OpenAI API
    // Use the numeric temperature and maxTokens values
    const numericTemperature = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
    const numericMaxTokens = typeof maxTokens === 'string' ? parseInt(maxTokens) : maxTokens;
    
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: processedSystemPrompt },
        { role: 'user', content: processedUserPrompt }
      ],
      temperature: numericTemperature,
      max_tokens: numericMaxTokens,
    });
    
    // Extract response data
    const content = response.choices[0]?.message?.content || '';
    
    // Track token usage
    if (response.usage) {
      trackTokenUsage({
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        timestamp: new Date(),
        userId,
        agentId
      });
    }
    
    // Return the content and token usage
    return {
      content,
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined
    };
  } catch (error: any) {
    // Enhanced error handling
    handleOpenAIError(error);
  }
}

/**
 * Generate a streaming response for real-time feedback with improved error handling
 * and connection management
 */
export async function* generateStreamingResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: string | number;
    maxTokens?: string | number;
    userId?: number;
    agentId?: number;
    conversationId?: number;
  } = {}
) {
  const {
    model = 'gpt-4o', // Default to the most capable model
    temperature = 0.7,
    maxTokens = 1000,
    userId,
    agentId,
    conversationId
  } = options;
  
  // Get user-specific API key if a userId is provided
  let apiKey: string | null = null;
  let startTime = Date.now();
  
  try {
    if (userId) {
      apiKey = await storage.getApiKey(userId);
    }
    
    // Create OpenAI client with the appropriate API key
    const openai = createOpenAIClient(apiKey || undefined);
    
    // Process and validate prompts
    const { systemPrompt: processedSystemPrompt, userPrompt: processedUserPrompt } = 
      processPrompts(systemPrompt, userPrompt);
    
    // Use the numeric temperature and maxTokens values
    const numericTemperature = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
    const numericMaxTokens = typeof maxTokens === 'string' ? parseInt(maxTokens) : maxTokens;
    
    // Add request timeout - break streaming after 45 seconds as a safeguard
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
      console.error('[openai] Streaming request timed out after 45 seconds');
    }, 45000);
    
    // Options for the API request
    const requestOptions = {
      timeout: 30000, // 30 second timeout for the initial connection
      signal: abortController.signal
    };
    
    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: processedSystemPrompt },
        { role: 'user', content: processedUserPrompt }
      ],
      temperature: numericTemperature,
      max_tokens: numericMaxTokens,
      stream: true
    }, requestOptions);
    
    let fullContent = '';
    let promptTokensEstimate = processedSystemPrompt.length / 4 + processedUserPrompt.length / 4;
    let completionTokensEstimate = 0;
    let streamStart = Date.now();
    let lastChunkTime = streamStart;
    let chunkCount = 0;
    
    try {
      // Stream the response
      for await (const chunk of stream) {
        // Clear timeout since we're getting data
        if (timeoutId) clearTimeout(timeoutId);
        
        // Get content from the chunk
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        completionTokensEstimate += content.length / 4;
        
        // Update timings for logging
        const now = Date.now();
        const timeSinceLastChunk = now - lastChunkTime;
        lastChunkTime = now;
        chunkCount++;
        
        // Log slow chunks (useful for debugging latency issues)
        if (timeSinceLastChunk > 1000) {
          console.log(`[openai] Slow chunk #${chunkCount}: ${timeSinceLastChunk}ms since last chunk`);
        }
        
        // Yield the chunk to the client
        yield {
          content,
          done: false
        };
      }
      
      // Log total streaming performance
      const totalStreamTime = Date.now() - streamStart;
      console.log(`[openai] Streaming complete: ${totalStreamTime}ms, ${chunkCount} chunks`);
      
      // Estimate token usage
      const totalTokensEstimate = promptTokensEstimate + completionTokensEstimate;
      
      // Track token usage
      trackTokenUsage({
        promptTokens: Math.round(promptTokensEstimate),
        completionTokens: Math.round(completionTokensEstimate),
        totalTokens: Math.round(totalTokensEstimate),
        timestamp: new Date(),
        userId,
        agentId
      });
      
      // Save to conversation history if we have IDs
      if (userId && agentId && conversationId) {
        try {
          await storage.createMessage({
            conversationId,
            role: 'assistant',
            content: fullContent,
            tokenCount: Math.round(completionTokensEstimate)
          });
        } catch (err) {
          console.error('[openai] Error saving message to conversation:', err);
        }
      }
      
      // Signal that streaming is complete
      yield {
        content: '',
        done: true,
        timing: {
          total: Date.now() - startTime,
          streaming: Date.now() - streamStart
        }
      };
    } finally {
      // Always clear the timeout to prevent memory leaks
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error('[openai] Streaming error:', error);
    
    // Let the client know there was an error
    yield {
      content: '',
      error: error.message || 'An error occurred during streaming',
      done: true
    };
    
    // Use enhanced error handling
    handleOpenAIError(error);
  }
}

/**
 * Test an agent with a user message
 */
export async function testAgentResponse(agent: Partial<any>, userMessage: string, userId?: number) {
  if (!agent.systemPrompt) {
    throw new Error('Agent system prompt is required');
  }
  
  return generateResponse(
    agent.systemPrompt,
    userMessage,
    {
      model: agent.model || 'gpt-4o',
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 1000,
      userId,
      agentId: agent.id
    }
  );
}

export default {
  generateResponse,
  generateStreamingResponse,
  testAgentResponse,
  trackTokenUsage,
  getTokenUsage
};