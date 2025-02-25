import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "default_key"
});

export async function generateResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature: number;
    maxTokens: number;
    model: string;
  }
) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
    };
  } catch (error: any) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

export async function testAgentResponse(agent: any, userMessage: string) {
  try {
    // Parse values to ensure correct types
    const temperature = typeof agent.temperature === 'string' 
      ? parseFloat(agent.temperature) 
      : agent.temperature;
      
    const maxTokens = typeof agent.maxTokens === 'string' 
      ? parseInt(agent.maxTokens) 
      : agent.maxTokens;
    
    return await generateResponse(
      agent.systemPrompt,
      userMessage,
      {
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2048,
        model: agent.model || "gpt-4o"
      }
    );
  } catch (error: any) {
    console.error("Agent testing error:", error);
    throw new Error(`Failed to test agent: ${error.message}`);
  }
}

export default {
  generateResponse,
  testAgentResponse
};
