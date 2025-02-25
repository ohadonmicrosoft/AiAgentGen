import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the connection pool with optimized connection settings
export const pool = postgres(process.env.DATABASE_URL, {
  max: 8,             // Maximum number of connections in the pool
  idle_timeout: 30,   // Close idle connections after 30 seconds
  connect_timeout: 10 // Connection timeout after 10 seconds
});

// Create the drizzle database instance
export const db = drizzle(pool, { schema });

// Export the schema for use in other files
export { schema };