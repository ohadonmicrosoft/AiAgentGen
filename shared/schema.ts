import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Added timestamp for better date handling

// Available roles and their permissions
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CREATOR: 'creator',
  VIEWER: 'viewer',
} as const;

// Permission levels for different operations
export const PERMISSIONS = {
  CREATE_AGENT: 'create_agent',
  EDIT_AGENT: 'edit_agent',
  DELETE_AGENT: 'delete_agent',
  VIEW_AGENT: 'view_agent',
  EDIT_ANY_AGENT: 'edit_any_agent',
  DELETE_ANY_AGENT: 'delete_any_agent',
  VIEW_ANY_AGENT: 'view_any_agent',

  CREATE_PROMPT: 'create_prompt',
  EDIT_PROMPT: 'edit_prompt',
  DELETE_PROMPT: 'delete_prompt',
  VIEW_PROMPT: 'view_prompt',
  EDIT_ANY_PROMPT: 'edit_any_prompt',
  DELETE_ANY_PROMPT: 'delete_any_prompt',
  VIEW_ANY_PROMPT: 'view_any_prompt',

  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',

  // Conversation permissions
  VIEW_CONVERSATIONS: 'view_conversations',
  VIEW_ANY_CONVERSATION: 'view_any_conversation',
  MANAGE_CONVERSATIONS: 'manage_conversations',
} as const;

// Role-based permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.MANAGER]: [
    PERMISSIONS.CREATE_AGENT,
    PERMISSIONS.EDIT_AGENT,
    PERMISSIONS.DELETE_AGENT,
    PERMISSIONS.VIEW_AGENT,
    PERMISSIONS.VIEW_ANY_AGENT,
    PERMISSIONS.EDIT_ANY_AGENT,
    PERMISSIONS.CREATE_PROMPT,
    PERMISSIONS.EDIT_PROMPT,
    PERMISSIONS.DELETE_PROMPT,
    PERMISSIONS.VIEW_PROMPT,
    PERMISSIONS.VIEW_ANY_PROMPT,
    PERMISSIONS.EDIT_ANY_PROMPT,
  ],
  [ROLES.CREATOR]: [
    PERMISSIONS.CREATE_AGENT,
    PERMISSIONS.EDIT_AGENT,
    PERMISSIONS.DELETE_AGENT,
    PERMISSIONS.VIEW_AGENT,
    PERMISSIONS.CREATE_PROMPT,
    PERMISSIONS.EDIT_PROMPT,
    PERMISSIONS.DELETE_PROMPT,
    PERMISSIONS.VIEW_PROMPT,
  ],
  [ROLES.VIEWER]: [PERMISSIONS.VIEW_AGENT, PERMISSIONS.VIEW_PROMPT],
};

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email'),
  role: text('role').default(ROLES.CREATOR).notNull(),
  customPermissions: json('custom_permissions').$type<string[]>(),
});

// Agents table
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  model: text('model').notNull(),
  temperature: text('temperature').notNull(),
  maxTokens: integer('max_tokens').notNull(),
  responseStyle: text('response_style'),
  systemPrompt: text('system_prompt'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Prompts table
export const prompts = pgTable('prompts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags').array(),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Conversations table to store agent interaction history
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  agentId: integer('agent_id')
    .references(() => agents.id)
    .notNull(),
  title: text('title'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages table to store individual messages in conversations
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id')
    .references(() => conversations.id)
    .notNull(),
  role: text('role').notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  customPermissions: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromptSchema = createInsertSchema(prompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof prompts.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Role and permission types
export type Role = (typeof ROLES)[keyof typeof ROLES];
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role validation schema
export const roleSchema = z.enum([
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.CREATOR,
  ROLES.VIEWER,
]);

// User with role update schema
export const userRoleUpdateSchema = z.object({
  userId: z.number(),
  role: roleSchema,
  customPermissions: z.array(z.string()).optional(),
});
