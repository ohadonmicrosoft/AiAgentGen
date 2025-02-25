import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Set up global error handler for uncaught exceptions related to database
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  
  // If connection errors persist, exit process to let the system restart
  if (err.message.includes('connect ECONNREFUSED') || 
      err.message.includes('too many clients') ||
      err.message.includes('Failed to acquire permit')) {
    console.error('Terminating application due to database connection issues');
    process.exit(1); // This will restart the application in most hosting environments
  }
});

// Create the connection pool with restrictive connection settings
// to prevent connection pool exhaustion
export const pool = postgres(process.env.DATABASE_URL, {
  max: 3,               // Lower maximum number of connections in the pool
  idle_timeout: 20,     // Close idle connections after 20 seconds
  connect_timeout: 15,  // Connection timeout after 15 seconds
  max_lifetime: 60 * 5, // Connections live max 5 minutes
  debug: false,         // Debug logging would be too verbose
  connection: {
    application_name: "ai-agent-generator" // Helps identify connections in DB logs
  },
  onnotice: (notice) => {
    console.log("Database notice:", notice);
  },
  onparameter: (key, value) => {
    console.log(`Database parameter ${key} = ${value}`);
  },
  onconnect: () => {
    console.log("New database connection established");
  },
  onend: () => {
    console.log("Database connection ended");
  },
  types: {
    // Use text type for date handling (avoid timezone issues)
    date: {
      to: 1114,      // OID for timestamp
      from: [1082],  // OID for date
      serialize: (date) => date instanceof Date ? date.toISOString() : date,
      parse: (str) => str // Keep as string, parse in application if needed
    }
  }
});

// Create the drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Export the schema for use in other files
export { schema };