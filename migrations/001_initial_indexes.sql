-- Migration: 001_initial_indexes
-- Description: Add indexes to frequently queried fields

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Indexes for agents table
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents (user_id);
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents (name);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents (status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents (type);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON agents (created_at);

-- Indexes for prompts table
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts (user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts (title);
CREATE INDEX IF NOT EXISTS idx_prompts_is_favorite ON prompts (is_favorite);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts (created_at);

-- Indexes for conversations table
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations (agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (created_at);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages (role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

-- Update the drizzle_migrations table to record this migration
-- This is handled automatically by the migrator 