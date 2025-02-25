import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Set up global error handler for uncaught exceptions related to database
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught exception:', err);
  
  // If connection errors persist, exit process to let the system restart
  if (err.message.includes('connect ECONNREFUSED') || 
      err.message.includes('too many clients') ||
      err.message.includes('Failed to acquire permit')) {
    console.error('Terminating application due to database connection issues');
    process.exit(1); // This will restart the application in most hosting environments
  }
});

/**
 * Create a single connection pool with very conservative settings
 * to prevent database connection exhaustion.
 * 
 * This singleton pattern ensures we're not creating multiple pools
 * throughout the application.
 */
export const pool = postgres(process.env.DATABASE_URL, {
  max: 2,                // Very limited connections to prevent exhaustion
  idle_timeout: 10,      // Close idle connections quickly (10 seconds)
  connect_timeout: 10,   // Connection timeout (10 seconds)
  max_lifetime: 60 * 2,  // Connections live max 2 minutes
  prepare: false,        // Disable prepared statements for simplicity
  connection: {
    application_name: "ai-agent-generator" // For DB logs
  }
});

// Create the drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Handle unhandled promise rejections (especially for database operations)
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled promise rejection:', reason);
  // Don't exit process here to avoid constant restarts
});

// Export the schema for use in other files
export { schema };