import { users, agents, prompts, ROLES, PERMISSIONS, ROLE_PERMISSIONS, type User, type InsertUser, type Agent, type InsertAgent, type Prompt, type InsertPrompt, type Role, type Permission } from "@shared/schema";
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
  getAllUsers(): Promise<User[]>;
  
  // User settings methods
  saveApiKey(userId: number, apiKey: string): Promise<void>;
  getApiKey(userId: number): Promise<string | null>;
  
  // Role and permission methods
  updateUserRole(userId: number, role: Role, customPermissions?: string[]): Promise<User>;
  getUserPermissions(userId: number): Promise<Permission[]>;
  hasPermission(userId: number, permission: Permission): Promise<boolean>;
  
  // Agent methods
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentsByUserId(userId: number): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<Agent>): Promise<Agent>;
  deleteAgent(id: number): Promise<void>;
  
  // Prompt methods
  getPrompt(id: number): Promise<Prompt | undefined>;
  getPromptsByUserId(userId: number): Promise<Prompt[]>;
  getAllPrompts(): Promise<Prompt[]>;
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
    
    // Process customPermissions to ensure it's an array of strings or null
    let customPermissions: string[] | null = null;
    if (insertUser.customPermissions) {
      // Create a safe string array to handle type issues
      const safePermissions: string[] = [];
      
      if (Array.isArray(insertUser.customPermissions)) {
        // Convert each item to string and filter out non-strings
        for (let i = 0; i < insertUser.customPermissions.length; i++) {
          const item = insertUser.customPermissions[i];
          if (typeof item === 'string') {
            safePermissions.push(item);
          }
        }
        
        if (safePermissions.length > 0) {
          customPermissions = safePermissions;
        }
      }
    }
    
    // Fix for type safety
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      role: insertUser.role || ROLES.CREATOR, // Default to CREATOR role
      customPermissions: customPermissions
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

  // Role and permission methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async updateUserRole(userId: number, role: Role, customPermissions?: string[]): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Process customPermissions to ensure it's a valid string array or null
    let safeCustomPermissions: string[] | null = null;
    if (customPermissions && Array.isArray(customPermissions)) {
      // Filter to only keep string values
      const filteredPermissions = customPermissions.filter(p => typeof p === 'string');
      
      if (filteredPermissions.length > 0) {
        safeCustomPermissions = filteredPermissions;
      }
    }

    const updatedUser = await this.updateUser(userId, { 
      role, 
      customPermissions: safeCustomPermissions 
    });

    return updatedUser;
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Get permissions based on role
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];
    
    // Add any custom permissions (ensure it's an array)
    const customPermissions = Array.isArray(user.customPermissions) ? user.customPermissions : [];
    
    // Combine permissions
    const allPermissions = [...rolePermissions, ...customPermissions];
    
    // Deduplicate permissions
    const uniquePermissions = Array.from(new Set(allPermissions));
    
    return uniquePermissions as Permission[];
  }

  async hasPermission(userId: number, permission: Permission): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  // Get all agents (for admins/managers)
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agentsMap.values());
  }

  // Get all prompts (for admins/managers)
  async getAllPrompts(): Promise<Prompt[]> {
    return Array.from(this.promptsMap.values());
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
