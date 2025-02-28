// Direct database setup script using TypeScript
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    console.log("Connecting to database...");
    const client = postgres(process.env.DATABASE_URL);

    console.log("Creating tables from schema...");

    // Create users table
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'creator',
        custom_permissions JSONB
      )
    `;
    console.log("✓ Users table created");

    // Create agents table
    await client`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        model TEXT NOT NULL,
        temperature TEXT NOT NULL,
        max_tokens INTEGER NOT NULL,
        response_style TEXT,
        system_prompt TEXT,
        status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Agents table created");

    // Create prompts table
    await client`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[],
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ Prompts table created");

    // Create api_keys table
    await client`
      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        api_key TEXT NOT NULL
      )
    `;
    console.log("✓ API Keys table created");

    // Create sessions table for connect-pg-simple
    await client`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `;
    console.log("✓ Sessions table created");

    await client`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `;
    console.log("✓ Sessions index created");

    console.log("Database setup completed successfully!");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exit(1);
  }
}

main();
