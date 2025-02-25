import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create the connection pool
export const pool = postgres(process.env.DATABASE_URL);

// Create the drizzle database instance
export const db = drizzle(pool, { schema });

// Export the schema for use in other files
export { schema };