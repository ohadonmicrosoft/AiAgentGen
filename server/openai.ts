import OpenAI from "openai";
import { Agent } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Define constants for rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 2048;
const DEFAULT_MODEL = "gpt-4o";

// For tracking token usage across the application
interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: Date;
  userId?: number;
  agentId?: number;
}

// In-memory token usage tracking - in a production app, this would be stored in a database
const tokenUsageHistory: TokenUsage[] = [];

/**
 * Track token usage for analytics and rate limiting
 */
export function trackTokenUsage(usage: TokenUsage) {
  tokenUsageHistory.push(usage);
  
  // In a production environment, you would also persist this data to a database
  // and potentially implement checks against user quotas
}

/**
 * Get token usage statistics for a specific user or globally
 */
export function getTokenUsage(options?: { userId?: number; timeframe?: 'day' | 'week' | 'month' | 'all' }) {
  const now = new Date();
  let filteredUsage = [...tokenUsageHistory];
  
  // Filter by user if userId is provided
  if (options?.userId) {
    filteredUsage = filteredUsage.filter(usage => usage.userId === options.userId);
  }
  
  // Filter by timeframe if provided
  if (options?.timeframe && options.timeframe !== 'all') {
    const timeframeMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    }[options.timeframe];
    
    filteredUsage = filteredUsage.filter(usage => 
      (now.getTime() - usage.timestamp.getTime()) <= timeframeMs
    );
  }
  
  // Calculate totals
  return filteredUsage.reduce((acc, curr) => ({
    promptTokens: acc.promptTokens + curr.promptTokens,
    completionTokens: acc.completionTokens + curr.completionTokens,
    totalTokens: acc.totalTokens + curr.totalTokens,
    count: acc.count + 1
  }), { promptTokens: 0, completionTokens: 0, totalTokens: 0, count: 0 });
}

/**
 * Process and validate system and user prompts
 */
function processPrompts(systemPrompt: string, userPrompt: string) {
  // Ensure prompts are strings
  systemPrompt = String(systemPrompt || '').trim();
  userPrompt = String(userPrompt || '').trim();
  
  // Validate prompts
  if (!systemPrompt) {
    throw new Error('System prompt is required');
  }
  
  if (!userPrompt) {
    throw new Error('User prompt is required');
  }
  
  return { systemPrompt, userPrompt };
}

/**
 * Enhanced OpenAI API error handling
 */
function handleOpenAIError(error: any): never {
  console.error('OpenAI API Error:', error);
  
  // Handle specific OpenAI error types
  if (error.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  } else if (error.status === 401) {
    throw new Error('API key is invalid or expired. Please check your configuration.');
  } else if (error.status === 400) {
    throw new Error(`Invalid request: ${error.message}`);
  } else if (error.status >= 500) {
    throw new Error('OpenAI service is currently unavailable. Please try again later.');
  }
  
  // Generic error fallback
  throw new Error(`OpenAI API error: ${error.message}`);
}

/**
 * Generate a response using OpenAI API with retry logic and enhanced error handling
 */
export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    userId?: number;
    agentId?: number;
  }
) {
  let retries = 0;
  
  // Process and validate prompts
  const { systemPrompt: validSystemPrompt, userPrompt: validUserPrompt } = 
    processPrompts(systemPrompt, userPrompt);
  
  // Set defaults for missing options
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const model = options.model ?? DEFAULT_MODEL;
  
  while (retries <= MAX_RETRIES) {
    try {
      // Create the completion
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: validSystemPrompt,
          },
          {
            role: "user",
            content: validUserPrompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });
      
      // Track token usage
      if (response.usage) {
        trackTokenUsage({
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
          timestamp: new Date(),
          userId: options.userId,
          agentId: options.agentId
        });
      }
      
      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
      };
    } catch (error: any) {
      retries++;
      
      // If it's a rate limit error and we haven't exceeded max retries, wait and try again
      if (error.status === 429 && retries <= MAX_RETRIES) {
        console.log(`Rate limit hit, retrying (${retries}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
        continue;
      }
      
      // For other errors or if we've exhausted retries, handle the error properly
      handleOpenAIError(error);
    }
  }
  
  // This should never be reached due to handleOpenAIError throwing, but TypeScript needs it
  throw new Error('Failed to generate response after multiple retries');
}

/**
 * Test an agent with a user message
 */
export async function testAgentResponse(agent: Partial<Agent>, userMessage: string, userId?: number) {
  try {
    // Parse values to ensure correct types
    const temperature = typeof agent.temperature === 'string' 
      ? parseFloat(agent.temperature) 
      : agent.temperature;
      
    const maxTokens = typeof agent.maxTokens === 'string' 
      ? parseInt(agent.maxTokens) 
      : agent.maxTokens;
    
    return await generateResponse(
      agent.systemPrompt || '',
      userMessage,
      {
        temperature: temperature || DEFAULT_TEMPERATURE,
        maxTokens: maxTokens || DEFAULT_MAX_TOKENS,
        model: agent.model || DEFAULT_MODEL,
        userId,
        agentId: typeof agent.id === 'number' ? agent.id : undefined
      }
    );
  } catch (error: any) {
    console.error("Agent testing error:", error);
    throw new Error(`Failed to test agent: ${error.message}`);
  }
}

/**
 * Get a streaming response for real-time feedback
 */
export async function* generateStreamingResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    userId?: number;
    agentId?: number;
  }
) {
  try {
    // Process and validate prompts
    const { systemPrompt: validSystemPrompt, userPrompt: validUserPrompt } = 
      processPrompts(systemPrompt, userPrompt);
    
    // Set defaults for missing options
    const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
    const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    const model = options.model ?? DEFAULT_MODEL;
    
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: validSystemPrompt,
        },
        {
          role: "user",
          content: validUserPrompt,
        },
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });
    
    let fullContent = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      chunkCount++;
      
      yield {
        content,
        fullContent,
        done: chunk.choices[0]?.finish_reason !== null,
      };
    }
    
    // Estimate token usage for streaming responses since OpenAI doesn't provide them
    // This is a rough estimate - in production you'd want a more sophisticated tokenizer
    const estimatedPromptTokens = Math.ceil((validSystemPrompt.length + validUserPrompt.length) / 4);
    const estimatedCompletionTokens = Math.ceil(fullContent.length / 4);
    
    trackTokenUsage({
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens: estimatedPromptTokens + estimatedCompletionTokens,
      timestamp: new Date(),
      userId: options.userId,
      agentId: options.agentId
    });
  } catch (error: any) {
    handleOpenAIError(error);
  }
}

export default {
  generateResponse,
  testAgentResponse,
  generateStreamingResponse,
  getTokenUsage,
  trackTokenUsage
};
