import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import { log } from "./vite";

// Initialize the Slack Web Client with the bot token
const slack = process.env.SLACK_BOT_TOKEN 
  ? new WebClient(process.env.SLACK_BOT_TOKEN)
  : null;

// Default channel ID from environment
const defaultChannelId = process.env.SLACK_CHANNEL_ID || '';

/**
 * Check if Slack integration is configured
 */
export function isSlackConfigured(): boolean {
  return !!slack && !!defaultChannelId;
}

/**
 * Send a message to a Slack channel
 * @param message - Message content or structured message
 * @param channelId - Optional override for the channel ID
 * @returns Promise resolving to the message timestamp or null if Slack is not configured
 */
export async function sendSlackMessage(
  message: string | ChatPostMessageArguments,
  channelId?: string
): Promise<string | null> {
  if (!slack) {
    log("Slack integration not configured", "slack");
    return null;
  }

  try {
    const channel = channelId || defaultChannelId;
    
    if (!channel) {
      log("No Slack channel specified", "slack");
      return null;
    }

    // Handle string messages vs structured messages
    const payload = typeof message === 'string' 
      ? { channel, text: message } 
      : { ...message, channel: message.channel || channel };

    const response = await slack.chat.postMessage(payload);
    
    if (response.ok) {
      log(`Message sent to Slack channel ${channel}`, "slack");
      return response.ts || null;
    } else {
      log(`Error sending to Slack: ${response.error}`, "slack");
      return null;
    }
  } catch (error: any) {
    log(`Slack API error: ${error.message}`, "slack");
    return null;
  }
}

/**
 * Send a notification when a new agent is created
 */
export async function notifyAgentCreated(agent: {
  id: number;
  name: string;
  description: string | null;
  status: string;
  userId: number;
  username?: string;
}): Promise<void> {
  if (!isSlackConfigured()) return;
  
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🤖 New Agent Created",
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Name:*\n${agent.name}`
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${agent.status === 'active' ? '✅ Active' : '📝 Draft'}`
        }
      ]
    }
  ];

  if (agent.description) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Description:*\n${agent.description}`,
        emoji: false
      }
    });
  }

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Created by:*\n${agent.username || `User #${agent.userId}`}`,
      emoji: false
    }
  });
  
  await sendSlackMessage({
    blocks: blocks as any,
    text: `New agent "${agent.name}" created by ${agent.username || `User #${agent.userId}`}`,
    channel: defaultChannelId
  });
}

/**
 * Send a notification when an agent is used
 */
export async function notifyAgentUsed(agent: {
  id: number;
  name: string;
  userId: number;
  username?: string;
}, query: string, tokenUsage?: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}): Promise<void> {
  if (!isSlackConfigured()) return;
  
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🔄 Agent Activity",
        emoji: true
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Agent:*\n${agent.name}`
        },
        {
          type: "mrkdwn",
          text: `*User:*\n${agent.username || `User #${agent.userId}`}`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Query:*\n\`\`\`${query}\`\`\``,
        emoji: false
      }
    }
  ];

  // Add token usage if available
  if (tokenUsage) {
    blocks.push({
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Token Usage:*\n${tokenUsage.totalTokens} tokens`
        },
        {
          type: "mrkdwn",
          text: `*Prompt/Completion:*\n${tokenUsage.promptTokens}/${tokenUsage.completionTokens}`
        }
      ]
    });
  }
  
  await sendSlackMessage({
    blocks,
    text: `Agent "${agent.name}" was used by ${agent.username || `User #${agent.userId}`}`,
    channel: defaultChannelId
  });
}

/**
 * Gets channel list (for admin settings)
 */
export async function getSlackChannels() {
  if (!slack) {
    return [];
  }

  try {
    const result = await slack.conversations.list({
      types: "public_channel,private_channel"
    });
    
    return result.channels || [];
  } catch (error: any) {
    log(`Error fetching Slack channels: ${error.message}`, "slack");
    return [];
  }
}

export default {
  sendSlackMessage,
  notifyAgentCreated,
  notifyAgentUsed,
  getSlackChannels,
  isSlackConfigured
};