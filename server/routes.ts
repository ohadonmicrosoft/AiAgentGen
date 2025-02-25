import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { checkAuthenticated } from "./middleware";
import { testAgentResponse } from "./openai";

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
        activeAgents: agents.filter(agent => agent.status === "active").length,
        savedPrompts: prompts.length,
        totalInteractions: 0 // Would be calculated from an interactions table in a real implementation
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Agents
  app.get("/api/agents", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const agents = await storage.getAgentsByUserId(userId);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.post("/api/agents", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const agent = await storage.createAgent({
        ...req.body,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: req.body.status || "draft"
      });
      res.status(201).json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.get("/api/agents/:id", checkAuthenticated, async (req, res) => {
    try {
      const agent = await storage.getAgent(parseInt(req.params.id));
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      if (agent.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.put("/api/agents/:id", checkAuthenticated, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      if (agent.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updatedAgent = await storage.updateAgent(agentId, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      res.json(updatedAgent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", checkAuthenticated, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const agent = await storage.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      if (agent.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.deleteAgent(agentId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // Prompts
  app.get("/api/prompts", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const prompts = await storage.getPromptsByUserId(userId);
      res.json(prompts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.post("/api/prompts", checkAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const prompt = await storage.createPrompt({
        ...req.body,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.status(201).json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  app.get("/api/prompts/:id", checkAuthenticated, async (req, res) => {
    try {
      const prompt = await storage.getPrompt(parseInt(req.params.id));
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      if (prompt.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompt" });
    }
  });

  app.put("/api/prompts/:id", checkAuthenticated, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const prompt = await storage.getPrompt(promptId);
      
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      if (prompt.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const updatedPrompt = await storage.updatePrompt(promptId, {
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      res.json(updatedPrompt);
    } catch (error) {
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  app.delete("/api/prompts/:id", checkAuthenticated, async (req, res) => {
    try {
      const promptId = parseInt(req.params.id);
      const prompt = await storage.getPrompt(promptId);
      
      if (!prompt) {
        return res.status(404).json({ error: "Prompt not found" });
      }
      
      if (prompt.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.deletePrompt(promptId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prompt" });
    }
  });

  // Test an agent with OpenAI
  app.post("/api/agents/test", checkAuthenticated, async (req, res) => {
    try {
      const { agentConfig, userMessage } = req.body;
      
      if (!agentConfig || !userMessage) {
        return res.status(400).json({ error: "Missing agent configuration or user message" });
      }
      
      const response = await testAgentResponse(agentConfig, userMessage);
      res.json(response);
    } catch (error: any) {
      console.error("OpenAI test error:", error);
      res.status(500).json({ error: error.message || "Failed to test agent" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}


