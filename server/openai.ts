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
 * Generate a streaming response for real-time feedback
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
    
    // Use the numeric temperature and maxTokens values
    const numericTemperature = typeof temperature === 'string' ? parseFloat(temperature) : temperature;
    const numericMaxTokens = typeof maxTokens === 'string' ? parseInt(maxTokens) : maxTokens;
    
    // Call OpenAI API with streaming
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: processedSystemPrompt },
        { role: 'user', content: processedUserPrompt }
      ],
      temperature: numericTemperature,
      max_tokens: numericMaxTokens,
      stream: true,
    });
    
    let fullContent = '';
    let promptTokensEstimate = processedSystemPrompt.length / 4 + processedUserPrompt.length / 4;
    let completionTokensEstimate = 0;
    
    // Stream the response
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      completionTokensEstimate += content.length / 4;
      
      yield {
        content,
        done: false
      };
    }
    
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
    
    // Signal that streaming is complete
    yield {
      content: '',
      done: true
    };
  } catch (error: any) {
    // Enhanced error handling
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