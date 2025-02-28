/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { type Server, createServer } from "http";
import { PERMISSIONS, ROLES, userRoleUpdateSchema } from "@shared/schema";
import type { Express } from "express";
import { setupAuth } from "./auth";
import {
  checkAdmin,
  checkAuthenticated,
  checkPermission,
  checkResourceOwnership,
} from "./middleware";
import openaiService, { testAgentResponse } from "./openai";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Stats
  app.get("/api/stats", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const agents = await storage.getAgentsByUserId(userId);
      const prompts = await storage.getPromptsByUserId(userId);

      res.json({
        activeAgents: agents.filter((agent) => agent.status === "active")
          .length,
        savedPrompts: prompts.length,
        totalInteractions: 0, // Would be calculated from an interactions table in a real implementation
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Agents
  app.get("/api/agents", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check if user has permission to view all agents
      const canViewAllAgents = await storage.hasPermission(
        userId,
        PERMISSIONS.VIEW_ANY_AGENT,
      );

      let agents;
      if (canViewAllAgents) {
        console.log(
          `[Agents] User ${userId} has permission to view all agents`,
        );
        agents = await storage.getAllAgents();
      } else {
        agents = await storage.getAgentsByUserId(userId);
      }

      res.json(agents);
    } catch (error) {
      console.error("[Agents] Error fetching agents:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.post("/api/agents", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check if user has permission to create agents
      const canCreateAgents = await storage.hasPermission(
        userId,
        PERMISSIONS.CREATE_AGENT,
      );

      if (!canCreateAgents) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to create agents",
        });
      }

      const agent = await storage.createAgent({
        ...req.body,
        userId,
        // createdAt and updatedAt will be automatically set by PostgreSQL
        status: req.body.status || "draft",
      });

      res.status(201).json(agent);
    } catch (error) {
      console.error("[Agents] Error creating agent:", error);
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.get(
    "/api/agents/:id",
    checkAuthenticated,
    checkResourceOwnership("agent", PERMISSIONS.VIEW_ANY_AGENT),
    async (req, res) => {
      try {
        const agent = await storage.getAgent(Number.parseInt(req.params.id));
        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        res.json(agent);
      } catch (error) {
        console.error("[Agents] Error fetching agent:", error);
        res.status(500).json({ error: "Failed to fetch agent" });
      }
    },
  );

  app.put(
    "/api/agents/:id",
    checkAuthenticated,
    checkResourceOwnership("agent", PERMISSIONS.EDIT_ANY_AGENT),
    async (req, res) => {
      try {
        const agentId = Number.parseInt(req.params.id);
        const agent = await storage.getAgent(agentId);

        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        const updatedAgent = await storage.updateAgent(agentId, {
          ...req.body,
          // updatedAt will be automatically set by PostgreSQL
        });

        res.json(updatedAgent);
      } catch (error) {
        console.error("[Agents] Error updating agent:", error);
        res.status(500).json({ error: "Failed to update agent" });
      }
    },
  );

  app.delete(
    "/api/agents/:id",
    checkAuthenticated,
    checkResourceOwnership("agent", PERMISSIONS.DELETE_ANY_AGENT),
    async (req, res) => {
      try {
        const agentId = Number.parseInt(req.params.id);
        const agent = await storage.getAgent(agentId);

        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        await storage.deleteAgent(agentId);
        res.sendStatus(204);
      } catch (error) {
        console.error("[Agents] Error deleting agent:", error);
        res.status(500).json({ error: "Failed to delete agent" });
      }
    },
  );

  // Prompts
  app.get("/api/prompts", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check if user has permission to view all prompts
      const canViewAllPrompts = await storage.hasPermission(
        userId,
        PERMISSIONS.VIEW_ANY_PROMPT,
      );

      let prompts;
      if (canViewAllPrompts) {
        console.log(
          `[Prompts] User ${userId} has permission to view all prompts`,
        );
        prompts = await storage.getAllPrompts();
      } else {
        prompts = await storage.getPromptsByUserId(userId);
      }

      res.json(prompts);
    } catch (error) {
      console.error("[Prompts] Error fetching prompts:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.post("/api/prompts", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;

      // Check if user has permission to create prompts
      const canCreatePrompts = await storage.hasPermission(
        userId,
        PERMISSIONS.CREATE_PROMPT,
      );

      if (!canCreatePrompts) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You do not have permission to create prompts",
        });
      }

      const prompt = await storage.createPrompt({
        ...req.body,
        userId,
        // createdAt and updatedAt will be automatically set by PostgreSQL
      });

      res.status(201).json(prompt);
    } catch (error) {
      console.error("[Prompts] Error creating prompt:", error);
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  app.get(
    "/api/prompts/:id",
    checkAuthenticated,
    checkResourceOwnership("prompt", PERMISSIONS.VIEW_ANY_PROMPT),
    async (req, res) => {
      try {
        const prompt = await storage.getPrompt(Number.parseInt(req.params.id));
        if (!prompt) {
          return res.status(404).json({ error: "Prompt not found" });
        }

        res.json(prompt);
      } catch (error) {
        console.error("[Prompts] Error fetching prompt:", error);
        res.status(500).json({ error: "Failed to fetch prompt" });
      }
    },
  );

  app.put(
    "/api/prompts/:id",
    checkAuthenticated,
    checkResourceOwnership("prompt", PERMISSIONS.EDIT_ANY_PROMPT),
    async (req, res) => {
      try {
        const promptId = Number.parseInt(req.params.id);
        const prompt = await storage.getPrompt(promptId);

        if (!prompt) {
          return res.status(404).json({ error: "Prompt not found" });
        }

        const updatedPrompt = await storage.updatePrompt(promptId, {
          ...req.body,
          // updatedAt will be automatically set by PostgreSQL
        });

        res.json(updatedPrompt);
      } catch (error) {
        console.error("[Prompts] Error updating prompt:", error);
        res.status(500).json({ error: "Failed to update prompt" });
      }
    },
  );

  app.delete(
    "/api/prompts/:id",
    checkAuthenticated,
    checkResourceOwnership("prompt", PERMISSIONS.DELETE_ANY_PROMPT),
    async (req, res) => {
      try {
        const promptId = Number.parseInt(req.params.id);
        const prompt = await storage.getPrompt(promptId);

        if (!prompt) {
          return res.status(404).json({ error: "Prompt not found" });
        }

        await storage.deletePrompt(promptId);
        res.sendStatus(204);
      } catch (error) {
        console.error("[Prompts] Error deleting prompt:", error);
        res.status(500).json({ error: "Failed to delete prompt" });
      }
    },
  );

  // Test an agent with OpenAI
  app.post("/api/agents/test", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const {
        agentId,
        message,
        systemPrompt,
        model,
        temperature,
        maxTokens,
        stream = false,
      } = req.body;

      console.log("Non-stream request body:", {
        agentId,
        message,
        systemPrompt,
        model,
        temperature,
        maxTokens,
      });

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get agent details if agentId is provided
      let agent;
      if (agentId && !isNaN(Number.parseInt(String(agentId)))) {
        agent = await storage.getAgent(Number.parseInt(String(agentId)));
        console.log("Found agent by ID:", agent);

        // Check if user can access this agent
        if (
          agent &&
          agent.userId !== userId &&
          !(await storage.hasPermission(userId, PERMISSIONS.VIEW_ANY_AGENT))
        ) {
          return res
            .status(403)
            .json({ error: "You don't have permission to use this agent" });
        }
      } else {
        // Use a temporary agent configuration from request body
        agent = {
          systemPrompt,
          model,
          temperature,
          maxTokens,
          ...req.body,
        };
        console.log("Using temporary agent:", agent);
      }

      if (!agent || !agent.systemPrompt) {
        console.log("Invalid agent configuration:", agent);
        return res.status(400).json({ error: "Invalid agent configuration" });
      }

      console.log("Testing agent with configuration:", {
        model: agent.model,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
      });

      // Get user for Slack notifications if needed
      const user = await storage.getUser(userId);

      // Use the enhanced OpenAI integration
      const response = await testAgentResponse(agent, message, userId);

      // Send Slack notification for agent usage
      if (
        agent.id &&
        process.env.SLACK_BOT_TOKEN &&
        process.env.SLACK_CHANNEL_ID
      ) {
        import("./slack").then(({ default: slackService }) => {
          const tokenUsage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          };

          if (response.usage) {
            // Handle different response formats
            if (
              "promptTokens" in response.usage &&
              typeof response.usage.promptTokens === "number"
            ) {
              tokenUsage.promptTokens = response.usage.promptTokens;
            } else if (
              "prompt_tokens" in response.usage &&
              typeof response.usage.prompt_tokens === "number"
            ) {
              tokenUsage.promptTokens = response.usage.prompt_tokens;
            }

            if (
              "completionTokens" in response.usage &&
              typeof response.usage.completionTokens === "number"
            ) {
              tokenUsage.completionTokens = response.usage.completionTokens;
            } else if (
              "completion_tokens" in response.usage &&
              typeof response.usage.completion_tokens === "number"
            ) {
              tokenUsage.completionTokens = response.usage.completion_tokens;
            }

            if (
              "totalTokens" in response.usage &&
              typeof response.usage.totalTokens === "number"
            ) {
              tokenUsage.totalTokens = response.usage.totalTokens;
            } else if (
              "total_tokens" in response.usage &&
              typeof response.usage.total_tokens === "number"
            ) {
              tokenUsage.totalTokens = response.usage.total_tokens;
            }
          }

          slackService.notifyAgentUsed(
            {
              id:
                typeof agent.id === "string"
                  ? Number.parseInt(agent.id)
                  : agent.id,
              name: agent.name,
              userId,
              username: user?.username,
            },
            message,
            tokenUsage,
          );
        });
      }

      res.json(response);
    } catch (error: any) {
      console.error("OpenAI test error:", error);
      res.status(500).json({ error: error.message || "Failed to test agent" });
    }
  });

  // Streaming API for real-time agent responses with enhanced error handling and performance
  app.post("/api/agents/test/stream", checkAuthenticated, async (req, res) => {
    const userId = req.user!.id;
    const {
      agentId,
      message,
      systemPrompt,
      model,
      temperature,
      maxTokens,
      conversationId: rawConversationId,
    } = req.body;

    // Save request start time for performance logging
    const requestStartTime = Date.now();

    // Parse the conversation ID if it exists
    let conversationId: number | undefined = undefined;
    if (
      rawConversationId &&
      !isNaN(Number.parseInt(String(rawConversationId)))
    ) {
      conversationId = Number.parseInt(String(rawConversationId));
    }

    console.log(`[Stream] Request from user ${userId}:`, {
      agentId,
      message: message?.slice(0, 50) + (message?.length > 50 ? "..." : ""),
      model,
      conversationId,
    });

    // Bail early for empty messages
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Set up connection timeout in case of hanging connections
    let connectionTimeout = setTimeout(() => {
      console.error("[Stream] Request timed out after 60s");
      if (!res.headersSent) {
        res.status(504).json({ error: "Request timed out" });
      } else {
        res.write(JSON.stringify({ error: "Request timed out", done: true }));
        res.end();
      }
    }, 60000); // 60-second timeout

    try {
      // Get agent details
      let agent;
      let agentIdNumber: number | undefined = undefined;

      if (agentId && !isNaN(Number.parseInt(String(agentId)))) {
        agentIdNumber = Number.parseInt(String(agentId));
        agent = await storage.getAgent(agentIdNumber);

        if (agent) {
          console.log(
            `[Stream] Using agent: "${agent.name}" (ID: ${agent.id})`,
          );

          // Check if user can access this agent
          if (
            agent.userId !== userId &&
            !(await storage.hasPermission(userId, PERMISSIONS.VIEW_ANY_AGENT))
          ) {
            clearTimeout(connectionTimeout);
            return res
              .status(403)
              .json({ error: "You don't have permission to use this agent" });
          }
        } else {
          console.warn(`[Stream] Agent not found: ${agentId}`);
        }
      }

      // If no agent was found but we have system prompt, create a temporary agent config
      if (!agent && systemPrompt) {
        agent = {
          systemPrompt,
          model: model || "gpt-4o",
          temperature: temperature !== undefined ? temperature : 0.7,
          maxTokens: maxTokens !== undefined ? maxTokens : 1000,
        };
        console.log("[Stream] Using temporary agent with custom system prompt");
      }

      // Validate agent configuration
      if (!agent || !agent.systemPrompt) {
        clearTimeout(connectionTimeout);
        console.error("[Stream] Invalid agent configuration:", agent);
        return res.status(400).json({ error: "Invalid agent configuration" });
      }

      // Create a conversation record if we don't have one but have an agent ID
      if (!conversationId && agentIdNumber) {
        try {
          const conversation = await storage.createConversation({
            userId,
            agentId: agentIdNumber,
            title: message.slice(0, 50), // Use the start of the message as the title
          });
          conversationId = conversation.id;
          console.log(`[Stream] Created new conversation: ${conversationId}`);

          // Save the user message to the conversation
          await storage.createMessage({
            conversationId,
            role: "user",
            content: message,
          });
        } catch (err) {
          console.error("[Stream] Error creating conversation:", err);
          // Continue even if conversation creation fails
        }
      }

      // Set up HTTP stream headers for real-time updates
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Prevents proxy buffering

      // Import the streaming function dynamically
      const { generateStreamingResponse, getTokenUsage } = await import(
        "./openai"
      );

      // Start streaming the AI response
      const stream = generateStreamingResponse(agent.systemPrompt, message, {
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        model: agent.model,
        userId,
        agentId: agentIdNumber,
        conversationId,
      });

      // Send Slack notification about agent usage (if configured)
      if (
        agentIdNumber &&
        process.env.SLACK_BOT_TOKEN &&
        process.env.SLACK_CHANNEL_ID
      ) {
        const user = await storage.getUser(userId);
        try {
          const { notifyAgentUsed } = await import("./slack");
          notifyAgentUsed(
            {
              id: agentIdNumber,
              name: agent.name || "Unnamed Agent",
              userId,
              username: user?.username || "Unknown User",
            },
            message,
          );
        } catch (err) {
          console.error("[Stream] Error sending Slack notification:", err);
          // Continue even if Slack notification fails
        }
      }

      // Stream the response chunks to the client
      for await (const chunk of stream) {
        // Clear the timeout since we're actively streaming
        clearTimeout(connectionTimeout);

        // Write the chunk to the response
        res.write(JSON.stringify(chunk));

        // If this is the last chunk, include token usage stats
        if (chunk.done) {
          try {
            const usageEstimate = getTokenUsage({ userId });
            res.write(
              JSON.stringify({
                usage: {
                  promptTokens: usageEstimate.promptTokens,
                  completionTokens: usageEstimate.completionTokens,
                  totalTokens: usageEstimate.totalTokens,
                },
                timing: {
                  total: Date.now() - requestStartTime,
                },
              }),
            );
          } catch (err) {
            console.error("[Stream] Error getting token usage:", err);
          }
        }

        // Set a new timeout for the next chunk
        connectionTimeout = setTimeout(() => {
          console.error("[Stream] Response streaming timed out after 30s");
          res.write(
            JSON.stringify({ error: "Streaming timed out", done: true }),
          );
          res.end();
        }, 30000); // 30-second timeout between chunks
      }

      // End the response
      res.end();
      console.log(
        `[Stream] Request completed in ${Date.now() - requestStartTime}ms`,
      );
    } catch (error: any) {
      console.error("[Stream] Error processing request:", error);

      // If we've already started streaming, send the error as a chunk
      if (res.headersSent) {
        res.write(
          JSON.stringify({
            error: error.message || "An error occurred during streaming",
            done: true,
          }),
        );
        res.end();
      } else {
        // Otherwise, send a proper error response
        res.status(500).json({
          error: error.message || "An error occurred during streaming",
        });
      }
    } finally {
      // Always clear the timeout to prevent memory leaks
      clearTimeout(connectionTimeout);
    }
  });

  // Verify OpenAI API connection
  app.get("/api/openai/verify", checkAuthenticated, async (req, res) => {
    try {
      const apiKey = await storage.getApiKey(req.user!.id);

      if (!apiKey && !process.env.OPENAI_API_KEY) {
        return res.status(400).json({
          error:
            "No API key found. Please add your OpenAI API key in the settings page.",
        });
      }

      // Just do a simple check with minimal tokens
      const response = await testAgentResponse(
        {
          systemPrompt: "You are a helpful assistant.",
          model: "gpt-4o",
          temperature: "0.7",
          maxTokens: "50",
        },
        "Hello, are you working?",
      );

      res.json({
        status: "success",
        message: "Successfully connected to OpenAI API",
        sample: response.content,
      });
    } catch (error: any) {
      console.error("OpenAI verification error:", error);
      res.status(500).json({
        status: "error",
        error: error.message || "Failed to verify OpenAI API connection",
      });
    }
  });

  // User profile and settings
  app.put("/api/user/profile", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("[UserSettings] Updating user profile for user", userId);

      // Validate incoming data
      const { username, email } = req.body;
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      // Update the user profile
      const updatedUser = await storage.updateUser(userId, {
        username,
        email: email || null,
      });

      // Return the updated user (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("[UserSettings] Profile update error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to update profile" });
    }
  });

  // Password change
  app.put("/api/user/password", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("[UserSettings] Password change request for user", userId);

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Current password and new password are required" });
      }

      // Get current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if current password matches
      if (user.password !== currentPassword) {
        // In production, use proper password hashing
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update the password
      await storage.updateUser(userId, {
        password: newPassword,
      });

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("[UserSettings] Password change error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to update password" });
    }
  });

  // API Key management
  app.get("/api/user/apikey", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("[UserSettings] Getting API key for user", userId);

      const apiKey = await storage.getApiKey(userId);

      // Instead of sending the actual key, just send a boolean indicating if it exists
      res.json({ hasApiKey: !!apiKey });
    } catch (error: any) {
      console.error("[UserSettings] Get API key error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to get API key status" });
    }
  });

  app.post("/api/user/apikey", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("[UserSettings] Saving API key for user", userId);

      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: "API Key is required" });
      }

      await storage.saveApiKey(userId, apiKey);
      res.json({ message: "API key saved successfully" });
    } catch (error: any) {
      console.error("[UserSettings] Save API key error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to save API key" });
    }
  });

  // Role-based access control (RBAC) endpoints

  // Get all available roles - admin only
  app.get("/api/admin/roles", checkAdmin, async (req, res) => {
    try {
      res.json(Object.values(ROLES));
    } catch (error: any) {
      console.error("[RBAC] Get roles error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch roles" });
    }
  });

  // Get all permissions - admin only
  app.get("/api/admin/permissions", checkAdmin, async (req, res) => {
    try {
      res.json(Object.values(PERMISSIONS));
    } catch (error: any) {
      console.error("[RBAC] Get permissions error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch permissions" });
    }
  });

  // Get all users - admin only
  app.get("/api/admin/users", checkAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();

      // Don't send passwords
      const sanitizedUsers = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("[RBAC] Get users error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch users" });
    }
  });

  // Update user role - admin only
  app.put("/api/admin/users/:id/role", checkAdmin, async (req, res) => {
    try {
      const userId = Number.parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Validate request body using the schema
      const validation = userRoleUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: "Invalid role update data",
          details: validation.error,
        });
      }

      const { role, customPermissions } = validation.data;

      // Don't allow changing one's own role (to prevent admin lockout)
      if (userId === req.user!.id) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You cannot change your own role",
        });
      }

      // Update the user's role
      const updatedUser = await storage.updateUserRole(
        userId,
        role,
        customPermissions,
      );

      // Don't send password back
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("[RBAC] Update user role error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to update user role" });
    }
  });

  // Get current user's permissions
  app.get("/api/user/permissions", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error: any) {
      console.error("[RBAC] Get user permissions error:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch user permissions" });
    }
  });

  // Conversation History Management

  // Create a new conversation
  app.post("/api/conversations", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { agentId, title } = req.body;
      console.log("[Conversations] Creating conversation for agent", agentId);

      if (!agentId) {
        return res.status(400).json({ error: "Agent ID is required" });
      }

      // Make sure agent exists
      const agent = await storage.getAgent(Number.parseInt(String(agentId)));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Check if user has permission to use this agent
      if (
        agent.userId !== userId &&
        !(await storage.hasPermission(userId, PERMISSIONS.VIEW_ANY_AGENT))
      ) {
        return res
          .status(403)
          .json({ error: "You don't have permission to use this agent" });
      }

      // Create the conversation
      const conversation = await storage.createConversation({
        userId,
        agentId: Number.parseInt(String(agentId)),
        title: title || `Conversation ${new Date().toLocaleString()}`,
      });

      res.status(201).json(conversation);
    } catch (error: any) {
      console.error("[Conversations] Error creating conversation:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to create conversation" });
    }
  });

  // Get user's conversations
  app.get("/api/conversations", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      console.log("[Conversations] Fetching conversations for user", userId);

      // Check if user has permission to view all conversations
      const canViewAllConversations = await storage.hasPermission(
        userId,
        PERMISSIONS.VIEW_ANY_CONVERSATION,
      );

      let conversations;
      if (canViewAllConversations) {
        // Admin can see all conversations
        conversations = await storage.getAllConversations();
      } else {
        conversations = await storage.getConversationsByUserId(userId);
      }

      res.json(conversations);
    } catch (error: any) {
      console.error("[Conversations] Error fetching conversations:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch conversations" });
    }
  });

  // Get conversations for a specific agent
  app.get(
    "/api/agents/:id/conversations",
    checkAuthenticated,
    async (req, res) => {
      try {
        const agentId = Number.parseInt(req.params.id);
        const userId = req.user!.id;
        console.log(
          "[Conversations] Fetching conversations for agent",
          agentId,
        );

        // Check if user has permission to view this agent
        const agent = await storage.getAgent(agentId);
        if (!agent) {
          return res.status(404).json({ error: "Agent not found" });
        }

        if (
          agent.userId !== userId &&
          !(await storage.hasPermission(userId, PERMISSIONS.VIEW_ANY_AGENT))
        ) {
          return res.status(403).json({
            error:
              "You don't have permission to view this agent's conversations",
          });
        }

        const conversations = await storage.getConversationsByAgentId(agentId);
        res.json(conversations);
      } catch (error: any) {
        console.error(
          "[Conversations] Error fetching agent conversations:",
          error,
        );
        res
          .status(500)
          .json({ error: error.message || "Failed to fetch conversations" });
      }
    },
  );

  // Get a specific conversation with its messages
  app.get("/api/conversations/:id", checkAuthenticated, async (req, res) => {
    try {
      const conversationId = Number.parseInt(req.params.id);
      const userId = req.user!.id;
      console.log("[Conversations] Fetching conversation", conversationId);

      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Check if user has permission to view this conversation
      if (
        conversation.userId !== userId &&
        !(await storage.hasPermission(
          userId,
          PERMISSIONS.VIEW_ANY_CONVERSATION,
        ))
      ) {
        return res.status(403).json({
          error: "You don't have permission to view this conversation",
        });
      }

      // Get messages for this conversation
      const messages =
        await storage.getMessagesByConversationId(conversationId);

      res.json({
        conversation,
        messages,
      });
    } catch (error: any) {
      console.error("[Conversations] Error fetching conversation:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to fetch conversation" });
    }
  });

  // Add a message to a conversation
  app.post(
    "/api/conversations/:id/messages",
    checkAuthenticated,
    async (req, res) => {
      try {
        const conversationId = Number.parseInt(req.params.id);
        const userId = req.user!.id;
        const { content, role, tokenCount } = req.body;
        console.log(
          "[Conversations] Adding message to conversation",
          conversationId,
        );

        if (!content || !role) {
          return res
            .status(400)
            .json({ error: "Content and role are required" });
        }

        // Check if conversation exists and user has access to it
        const conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        if (
          conversation.userId !== userId &&
          !(await storage.hasPermission(
            userId,
            PERMISSIONS.VIEW_ANY_CONVERSATION,
          ))
        ) {
          return res.status(403).json({
            error: "You don't have permission to access this conversation",
          });
        }

        // Create message
        const message = await storage.createMessage({
          conversationId,
          content,
          role,
          tokenCount: tokenCount || 0,
        });

        // Update conversation's updatedAt timestamp
        await storage.updateConversation(conversationId, {
          updatedAt: new Date(),
        });

        res.status(201).json(message);
      } catch (error: any) {
        console.error("[Conversations] Error adding message:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to add message" });
      }
    },
  );

  // Delete a conversation
  app.delete("/api/conversations/:id", checkAuthenticated, async (req, res) => {
    try {
      const conversationId = Number.parseInt(req.params.id);
      const userId = req.user!.id;
      console.log("[Conversations] Deleting conversation", conversationId);

      // Check if conversation exists and user has access to it
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      if (
        conversation.userId !== userId &&
        !(await storage.hasPermission(userId, PERMISSIONS.MANAGE_CONVERSATIONS))
      ) {
        return res.status(403).json({
          error: "You don't have permission to delete this conversation",
        });
      }

      // Delete conversation (this should cascade delete all messages)
      await storage.deleteConversation(conversationId);

      res.sendStatus(204);
    } catch (error: any) {
      console.error("[Conversations] Error deleting conversation:", error);
      res
        .status(500)
        .json({ error: error.message || "Failed to delete conversation" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
