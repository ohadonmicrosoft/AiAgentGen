import {
  users,
  agents,
  prompts,
  conversations,
  messages,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type User,
  type InsertUser,
  type Agent,
  type InsertAgent,
  type Prompt,
  type InsertPrompt,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Role,
  type Permission,
} from '@shared/schema';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { db } from './db'; // Import the shared db instance directly
import connectPg from 'connect-pg-simple';
import {
  userCache,
  agentCache,
  promptCache,
  conversationCache,
  getOrCompute,
} from './lib/cache';

const MemoryStore = createMemoryStore(session);
// Create a simpler type definition that avoids complications
type SessionStore = any;

// Create a separate table for API keys
// We'll define this inside storage.ts since it's internal implementation detail
import { pgTable, text, integer, serial } from 'drizzle-orm/pg-core';
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  apiKey: text('api_key').notNull(),
});

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
  updateUserRole(
    userId: number,
    role: Role,
    customPermissions?: string[],
  ): Promise<User>;
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

  // Conversation history methods
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  getConversationsByAgentId(agentId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(
    id: number,
    conversation: Partial<Conversation>,
  ): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Session store
  sessionStore: SessionStore;
}

// PostgreSQL Database Storage Implementation
export class PostgresStorage implements IStorage {
  db: PostgresJsDatabase<any>;
  sessionStore: SessionStore;

  constructor() {
    // Use the shared db instance that was already imported at the top
    this.db = db;

    // Always use memory store for sessions to avoid excessive database connections
    // This is a safer approach, especially in environments with connection limits
    this.sessionStore = new MemoryStore({
      checkPeriod: 3600000, // Check for expired sessions every hour (instead of 24 hours)
      max: 1000, // Store maximum of 1000 sessions
      stale: true, // Allow retrieval of expired sessions
    });

    console.log(
      '[Storage] Using in-memory session store to reduce database load',
    );
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const cacheKey = `user:id:${id}`;

    return getOrCompute(userCache, cacheKey, async () => {
      const results = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return results.length ? results[0] : undefined;
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const cacheKey = `user:username:${username}`;

    return getOrCompute(userCache, cacheKey, async () => {
      const results = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      return results.length ? results[0] : undefined;
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Process customPermissions to ensure it's an array of strings or null
    let customPermissions: string[] | null = null;
    if (insertUser.customPermissions) {
      const safePermissions: string[] = [];

      if (Array.isArray(insertUser.customPermissions)) {
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

    const user = {
      ...insertUser,
      email: insertUser.email || null,
      role: insertUser.role || ROLES.CREATOR,
      customPermissions: customPermissions,
    };

    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const result = await this.db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`User with id ${id} not found`);
    }

    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async saveApiKey(userId: number, apiKey: string): Promise<void> {
    // Check if key already exists
    const existing = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    if (existing.length > 0) {
      // Update existing key
      await this.db
        .update(apiKeys)
        .set({ apiKey })
        .where(eq(apiKeys.userId, userId));
    } else {
      // For serial ID columns, we don't need to specify the ID as it's auto-generated
      const query = this.db.insert(apiKeys).values({
        userId,
        apiKey,
      });

      // Execute the query
      await query;
    }
  }

  async getApiKey(userId: number): Promise<string | null> {
    const results = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    return results.length > 0 ? results[0].apiKey : null;
  }

  // Role and permission methods
  async updateUserRole(
    userId: number,
    role: Role,
    customPermissions?: string[],
  ): Promise<User> {
    // Process customPermissions to ensure it's a valid string array or null
    let safeCustomPermissions: string[] | null = null;
    if (customPermissions && Array.isArray(customPermissions)) {
      const filteredPermissions = customPermissions.filter(
        (p) => typeof p === 'string',
      );

      if (filteredPermissions.length > 0) {
        safeCustomPermissions = filteredPermissions;
      }
    }

    const result = await this.db
      .update(users)
      .set({
        role,
        customPermissions: safeCustomPermissions,
      })
      .where(eq(users.id, userId))
      .returning();

    if (result.length === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    return result[0];
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Get permissions based on role
    const rolePermissions = ROLE_PERMISSIONS[user.role as Role] || [];

    // Add any custom permissions (ensure it's an array)
    const customPermissions = Array.isArray(user.customPermissions)
      ? user.customPermissions
      : [];

    // Combine permissions
    const allPermissions = [...rolePermissions, ...customPermissions];

    // Deduplicate permissions
    const uniquePermissions = Array.from(new Set(allPermissions));

    return uniquePermissions as Permission[];
  }

  async hasPermission(
    userId: number,
    permission: Permission,
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    const cacheKey = `agent:${id}`;

    return getOrCompute(agentCache, cacheKey, async () => {
      const results = await this.db
        .select()
        .from(agents)
        .where(eq(agents.id, id))
        .limit(1);
      return results.length ? results[0] : undefined;
    });
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return await this.db.select().from(agents).where(eq(agents.userId, userId));
  }

  async getAllAgents(): Promise<Agent[]> {
    return await this.db.select().from(agents);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent = {
      ...insertAgent,
      description: insertAgent.description || null,
      responseStyle: insertAgent.responseStyle || null,
      systemPrompt: insertAgent.systemPrompt || null,
      // createdAt and updatedAt will be set by the database defaultNow()
    };

    const result = await this.db.insert(agents).values(agent).returning();
    return result[0];
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent> {
    // Invalidate cache
    agentCache.delete(`agent:${id}`);

    // Update in database
    const result = await this.db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Agent with id ${id} not found`);
    }

    return result[0];
  }

  async deleteAgent(id: number): Promise<void> {
    await this.db.delete(agents).where(eq(agents.id, id));
  }

  // Prompt methods
  async getPrompt(id: number): Promise<Prompt | undefined> {
    const cacheKey = `prompt:${id}`;

    return getOrCompute(promptCache, cacheKey, async () => {
      const results = await this.db
        .select()
        .from(prompts)
        .where(eq(prompts.id, id))
        .limit(1);
      return results.length ? results[0] : undefined;
    });
  }

  async getPromptsByUserId(userId: number): Promise<Prompt[]> {
    return await this.db
      .select()
      .from(prompts)
      .where(eq(prompts.userId, userId));
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return await this.db.select().from(prompts);
  }

  async createPrompt(insertPrompt: InsertPrompt): Promise<Prompt> {
    const prompt = {
      ...insertPrompt,
      tags: insertPrompt.tags || null,
      isFavorite: insertPrompt.isFavorite || false,
      // createdAt and updatedAt will be set by the database defaultNow()
    };

    const result = await this.db.insert(prompts).values(prompt).returning();
    return result[0];
  }

  async updatePrompt(id: number, updates: Partial<Prompt>): Promise<Prompt> {
    // Invalidate cache
    promptCache.delete(`prompt:${id}`);

    // Update in database
    const result = await this.db
      .update(prompts)
      .set(updates)
      .where(eq(prompts.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    return result[0];
  }

  async deletePrompt(id: number): Promise<void> {
    await this.db.delete(prompts).where(eq(prompts.id, id));
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    const results = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return results[0];
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await this.db
      .select()
      .from(conversations)
      .orderBy(conversations.updatedAt);
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(conversations.updatedAt);
  }

  async getConversationsByAgentId(agentId: number): Promise<Conversation[]> {
    return await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.agentId, agentId))
      .orderBy(conversations.updatedAt);
  }

  async createConversation(
    insertConversation: InsertConversation,
  ): Promise<Conversation> {
    const conversation = {
      ...insertConversation,
      title: insertConversation.title || null,
      // createdAt and updatedAt will be set by the database defaultNow()
    };

    const result = await this.db
      .insert(conversations)
      .values(conversation)
      .returning();
    return result[0];
  }

  async updateConversation(
    id: number,
    updates: Partial<Conversation>,
  ): Promise<Conversation> {
    // Remove any timestamps from updates as they're handled by the database
    const { createdAt, updatedAt, ...safeUpdates } = updates;

    const result = await this.db
      .update(conversations)
      .set({
        ...safeUpdates,
        updatedAt: new Date(), // PostgreSQL will handle the timestamp conversion
      })
      .where(eq(conversations.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    return result[0];
  }

  async deleteConversation(id: number): Promise<void> {
    // First delete all messages in this conversation
    await this.db.delete(messages).where(eq(messages.conversationId, id));
    // Then delete the conversation itself
    await this.db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const results = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return results[0];
  }

  async getMessagesByConversationId(
    conversationId: number,
  ): Promise<Message[]> {
    return await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message = {
      ...insertMessage,
      tokenCount: insertMessage.tokenCount || null,
      // createdAt will be set by the database defaultNow()
    };

    const result = await this.db.insert(messages).values(message).returning();
    return result[0];
  }

  // Get conversation with messages by ID with caching
  async getConversationWithMessages(
    id: number,
  ): Promise<{ conversation: Conversation; messages: Message[] } | null> {
    const cacheKey = `conversation:${id}:with-messages`;

    return getOrCompute(conversationCache, cacheKey, async () => {
      // Get conversation
      const conversationResult = await this.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1);
      if (!conversationResult.length) {
        return null;
      }

      // Get messages
      const messagesResult = await this.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id));

      return {
        conversation: conversationResult[0],
        messages: messagesResult,
      };
    });
  }
}

// In-memory storage implementation for development and testing
export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private agentsMap: Map<number, Agent>;
  private promptsMap: Map<number, Prompt>;
  private apiKeysMap: Map<number, string>;
  private conversationsMap: Map<number, Conversation>;
  private messagesMap: Map<number, Message>;

  userIdCounter: number;
  agentIdCounter: number;
  promptIdCounter: number;
  conversationIdCounter: number;
  messageIdCounter: number;
  sessionStore: SessionStore;

  constructor() {
    this.usersMap = new Map();
    this.agentsMap = new Map();
    this.promptsMap = new Map();
    this.apiKeysMap = new Map();
    this.conversationsMap = new Map();
    this.messagesMap = new Map();

    this.userIdCounter = 1;
    this.agentIdCounter = 1;
    this.promptIdCounter = 1;
    this.conversationIdCounter = 1;
    this.messageIdCounter = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 3600000, // Check for expired sessions every hour
      max: 1000, // Store maximum of 1000 sessions
      stale: true, // Allow retrieval of expired sessions
    });

    console.log('[Storage] Using in-memory session store for MemStorage');
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
      customPermissions: customPermissions,
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

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async saveApiKey(userId: number, apiKey: string): Promise<void> {
    this.apiKeysMap.set(userId, apiKey);
  }

  async getApiKey(userId: number): Promise<string | null> {
    return this.apiKeysMap.get(userId) || null;
  }

  // Role and permission methods
  async updateUserRole(
    userId: number,
    role: Role,
    customPermissions?: string[],
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    // Process customPermissions to ensure it's a valid string array or null
    let safeCustomPermissions: string[] | null = null;
    if (customPermissions && Array.isArray(customPermissions)) {
      // Filter to only keep string values
      const filteredPermissions = customPermissions.filter(
        (p) => typeof p === 'string',
      );

      if (filteredPermissions.length > 0) {
        safeCustomPermissions = filteredPermissions;
      }
    }

    const updatedUser = await this.updateUser(userId, {
      role,
      customPermissions: safeCustomPermissions,
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
    const customPermissions = Array.isArray(user.customPermissions)
      ? user.customPermissions
      : [];

    // Combine permissions
    const allPermissions = [...rolePermissions, ...customPermissions];

    // Deduplicate permissions
    const uniquePermissions = Array.from(new Set(allPermissions));

    return uniquePermissions as Permission[];
  }

  async hasPermission(
    userId: number,
    permission: Permission,
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
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
    const now = new Date();

    // Fix for type safety
    const agent: Agent = {
      ...insertAgent,
      id,
      description: insertAgent.description || null,
      responseStyle: insertAgent.responseStyle || null,
      systemPrompt: insertAgent.systemPrompt || null,
      createdAt: now,
      updatedAt: now,
    };
    this.agentsMap.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<Agent>): Promise<Agent> {
    const agent = this.agentsMap.get(id);
    if (!agent) {
      throw new Error(`Agent with id ${id} not found`);
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const updatedAgent = { ...agent, ...updatesWithTimestamp };
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
    const now = new Date();

    // Fix for type safety
    const prompt: Prompt = {
      ...insertPrompt,
      id,
      tags: insertPrompt.tags || null,
      isFavorite: insertPrompt.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };
    this.promptsMap.set(id, prompt);
    return prompt;
  }

  async updatePrompt(id: number, updates: Partial<Prompt>): Promise<Prompt> {
    const prompt = this.promptsMap.get(id);
    if (!prompt) {
      throw new Error(`Prompt with id ${id} not found`);
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const updatedPrompt = { ...prompt, ...updatesWithTimestamp };
    this.promptsMap.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async deletePrompt(id: number): Promise<void> {
    this.promptsMap.delete(id);
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversationsMap.get(id);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversationsMap.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.conversationsMap.values())
      .filter((conversation) => conversation.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversationsByAgentId(agentId: number): Promise<Conversation[]> {
    return Array.from(this.conversationsMap.values())
      .filter((conversation) => conversation.agentId === agentId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createConversation(
    insertConversation: InsertConversation,
  ): Promise<Conversation> {
    const id = this.conversationIdCounter++;
    const now = new Date();

    const conversation: Conversation = {
      ...insertConversation,
      id,
      title: insertConversation.title || null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversationsMap.set(id, conversation);
    return conversation;
  }

  async updateConversation(
    id: number,
    updates: Partial<Conversation>,
  ): Promise<Conversation> {
    const conversation = this.conversationsMap.get(id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date(),
    };

    const updatedConversation = { ...conversation, ...updatesWithTimestamp };
    this.conversationsMap.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<void> {
    // Get all messages in this conversation
    const messages = this.getMessagesByConversationId(id);

    // Delete each message
    messages.then((msgs) => {
      msgs.forEach((msg) => {
        this.messagesMap.delete(msg.id);
      });
    });

    // Delete the conversation
    this.conversationsMap.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesMap.get(id);
  }

  async getMessagesByConversationId(
    conversationId: number,
  ): Promise<Message[]> {
    const messages = Array.from(this.messagesMap.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();

    const message: Message = {
      ...insertMessage,
      id,
      tokenCount: insertMessage.tokenCount || null,
      createdAt: now,
    };
    this.messagesMap.set(id, message);
    return message;
  }
}

// Add a mock in-memory storage for testing
const mockUsers: User[] = [];
let mockUserId = 1;

class MockStorage implements IStorage {
  sessionStore: SessionStore;
  private mockAgents: Map<number, Agent> = new Map();
  private mockPrompts: Map<number, Prompt> = new Map();
  private mockConversations: Map<number, Conversation> = new Map();
  private mockMessages: Map<number, Message> = new Map();
  private mockAgentIdCounter = 1;
  private mockPromptIdCounter = 1;
  private mockConversationIdCounter = 1;
  private mockMessageIdCounter = 1;

  constructor() {
    console.log('[Storage] Using in-memory storage for testing');
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });

    // Pre-create a developer account for testing (with simplified password)
    this.createUser({
      username: 'developer',
      password: 'password123mocktestsalt.mocktestsalt', // Matches our simplified hashing in auth.ts
      email: 'dev@example.com',
      role: 'ADMIN',
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return mockUsers.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return mockUsers.find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: mockUserId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockUsers.push(newUser);
    console.log('[Storage] Created mock user:', newUser.username);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error('User not found');

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    return mockUsers[userIndex];
  }

  async getAllUsers(): Promise<User[]> {
    return [...mockUsers];
  }

  async saveApiKey(userId: number, apiKey: string): Promise<void> {
    // Just mock the API key storage
    console.log(`[Storage] Saved API key for user ID ${userId}`);
  }

  async getApiKey(userId: number): Promise<string | null> {
    return 'mock-api-key-for-testing';
  }

  async updateUserRole(
    userId: number,
    role: Role,
    customPermissions?: string[],
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    return this.updateUser(userId, { role });
  }

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    // Return all permissions for simplicity in testing
    return Object.values(PERMISSIONS);
  }

  async hasPermission(
    userId: number,
    permission: Permission,
  ): Promise<boolean> {
    // Allow all permissions in testing
    return true;
  }

  // Agent methods
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.mockAgents.get(id);
  }

  async getAgentsByUserId(userId: number): Promise<Agent[]> {
    return Array.from(this.mockAgents.values()).filter(
      (agent) => agent.userId === userId,
    );
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.mockAgents.values());
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.mockAgentIdCounter++;
    const now = new Date();

    const newAgent: Agent = {
      ...agent,
      id,
      description: agent.description || null,
      responseStyle: agent.responseStyle || null,
      systemPrompt: agent.systemPrompt || null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockAgents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(id: number, agent: Partial<Agent>): Promise<Agent> {
    const existingAgent = this.mockAgents.get(id);
    if (!existingAgent) throw new Error(`Agent with id ${id} not found`);

    const updatedAgent: Agent = {
      ...existingAgent,
      ...agent,
      updatedAt: new Date(),
    };

    this.mockAgents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<void> {
    this.mockAgents.delete(id);
  }

  // Prompt methods
  async getPrompt(id: number): Promise<Prompt | undefined> {
    return this.mockPrompts.get(id);
  }

  async getPromptsByUserId(userId: number): Promise<Prompt[]> {
    return Array.from(this.mockPrompts.values()).filter(
      (prompt) => prompt.userId === userId,
    );
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return Array.from(this.mockPrompts.values());
  }

  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const id = this.mockPromptIdCounter++;
    const now = new Date();

    const newPrompt: Prompt = {
      ...prompt,
      id,
      tags: prompt.tags || null,
      isFavorite: prompt.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };

    this.mockPrompts.set(id, newPrompt);
    return newPrompt;
  }

  async updatePrompt(id: number, prompt: Partial<Prompt>): Promise<Prompt> {
    const existingPrompt = this.mockPrompts.get(id);
    if (!existingPrompt) throw new Error(`Prompt with id ${id} not found`);

    const updatedPrompt: Prompt = {
      ...existingPrompt,
      ...prompt,
      updatedAt: new Date(),
    };

    this.mockPrompts.set(id, updatedPrompt);
    return updatedPrompt;
  }

  async deletePrompt(id: number): Promise<void> {
    this.mockPrompts.delete(id);
  }

  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.mockConversations.get(id);
  }

  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return Array.from(this.mockConversations.values())
      .filter((conversation) => conversation.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversationsByAgentId(agentId: number): Promise<Conversation[]> {
    return Array.from(this.mockConversations.values())
      .filter((conversation) => conversation.agentId === agentId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async createConversation(
    conversation: InsertConversation,
  ): Promise<Conversation> {
    const id = this.mockConversationIdCounter++;
    const now = new Date();

    const newConversation: Conversation = {
      ...conversation,
      id,
      title: conversation.title || null,
      createdAt: now,
      updatedAt: now,
    };

    this.mockConversations.set(id, newConversation);
    return newConversation;
  }

  async updateConversation(
    id: number,
    conversation: Partial<Conversation>,
  ): Promise<Conversation> {
    const existingConversation = this.mockConversations.get(id);
    if (!existingConversation)
      throw new Error(`Conversation with id ${id} not found`);

    const updatedConversation: Conversation = {
      ...existingConversation,
      ...conversation,
      updatedAt: new Date(),
    };

    this.mockConversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<void> {
    // Delete all messages in this conversation
    Array.from(this.mockMessages.values())
      .filter((message) => message.conversationId === id)
      .forEach((message) => this.mockMessages.delete(message.id));

    // Delete the conversation
    this.mockConversations.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.mockMessages.get(id);
  }

  async getMessagesByConversationId(
    conversationId: number,
  ): Promise<Message[]> {
    return Array.from(this.mockMessages.values())
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.mockMessageIdCounter++;

    const newMessage: Message = {
      ...message,
      id,
      tokenCount: message.tokenCount || null,
      createdAt: new Date(),
    };

    this.mockMessages.set(id, newMessage);
    return newMessage;
  }

  // For compatibility with the PostgresStorage implementation
  async getConversationWithMessages(
    id: number,
  ): Promise<{ conversation: Conversation; messages: Message[] } | null> {
    const conversation = await this.getConversation(id);
    if (!conversation) return null;

    const messages = await this.getMessagesByConversationId(id);

    return { conversation, messages };
  }
}

// Determine whether to use the mock or real storage
const isDevelopmentTesting =
  !process.env.DATABASE_URL || process.env.USE_MOCK_STORAGE === 'true';

// Export the appropriate storage implementation
export const storage = isDevelopmentTesting
  ? new MockStorage()
  : new PostgresStorage();
