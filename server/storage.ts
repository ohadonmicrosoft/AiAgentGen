import { users, agents, prompts, type User, type InsertUser, type Agent, type InsertAgent, type Prompt, type InsertPrompt } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
// Create a simpler type definition that avoids complications
type SessionStore = any;

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  
  // User settings methods
  saveApiKey(userId: number, apiKey: string): Promise<void>;
  getApiKey(userId: number): Promise<string | null>;
  
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;
  
  // Prompt methods
  getPrompt(id: number): Promise<Prompt | undefined>;
  getPromptsByUserId(userId: number): Promise<Prompt[]>;
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  updatePrompt(id: number, prompt: Partial<Prompt>): Promise<Prompt>;
  deletePrompt(id: number): Promise<void>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private agentsMap: Map<number, Agent>;
  private promptsMap: Map<number, Prompt>;
  private apiKeysMap: Map<number, string>;
  
  userIdCounter: number;
  agentIdCounter: number;
  promptIdCounter: number;
  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.agentsMap = new Map();
    this.promptsMap = new Map();
    this.apiKeysMap = new Map();
    
    this.userIdCounter = 1;
    this.agentIdCounter = 1;
    this.promptIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Fix for type safety
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null 
    };
    this.usersMap.set(id, user);
    return user;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.usersMap.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...updates };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }
  
  async saveApiKey(userId: number, apiKey: string): Promise<void> {
    this.apiKeysMap.set(userId, apiKey);
  }
  
  async getApiKey(userId: number): Promise<string | null> {
    return this.apiKeysMap.get(userId) || null;
  }

  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agentsMap.get(id);
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.agentsMap.values()).filter(
      (agent) => agent.userId === userId,
    );
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.agentIdCounter++;
    // Fix for type safety
    const agent: Agent = { 
      ...insertAgent, 
      id,
      description: insertAgent.description || null,
      responseStyle: insertAgent.responseStyle || null,
      systemPrompt: insertAgent.systemPrompt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.agentsMap.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent> {
    const agent = this.agentsMap.get(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }
    
    const updatedAgent = { ...agent, ...updates };
    this.agentsMap.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<void> {
    this.agentsMap.delete(id);
  }

  // Prompt methods
  async getPrompt(id: number): Promise<Prompt | undefined> {
    return this.promptsMap.get(id);
  }

  async getPromptsByUserId(userId: number): Promise<Prompt[]> {
    return Array.from(this.promptsMap.values()).filter(
      (prompt) => prompt.userId === userId,
    );
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const id = this.promptIdCounter++;
    // Fix for type safety
    const prompt: Prompt = { 
      ...insertPrompt, 
      id,
      tags: insertPrompt.tags || null,
      isFavorite: insertPrompt.isFavorite || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.promptsMap.set(id, prompt);
    return prompt;
  }

  async updatePrompt(id: number, updates: Partial<Prompt>): Promise<Prompt> {
    const prompt = this.promptsMap.get(id);
    if (!prompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }
    
    const updatedPrompt = { ...prompt, ...updates };
    this.promptsMap.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async deletePrompt(id: number): Promise<void> {
    this.promptsMap.delete(id);
  }
}

export const storage = new MemStorage();
