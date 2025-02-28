import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { logger } from "./api/logs";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Environment-based pool configuration
const isDevelopment = process.env.NODE_ENV !== 'production';
const MAX_CONNECTIONS = isDevelopment ? 3 : 10;
const IDLE_TIMEOUT = isDevelopment ? 10 : 30; // seconds

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

// Connection health monitoring
let healthCheckInterval: NodeJS.Timeout | null = null;
let failedHealthChecks = 0;

/**
 * Create a single connection pool with optimized settings based on environment.
 * This singleton pattern ensures we're not creating multiple pools throughout the application.
 */
export const pool = postgres(process.env.DATABASE_URL, {
  max: MAX_CONNECTIONS,
  idle_timeout: IDLE_TIMEOUT,
  connect_timeout: 15,      // Connection timeout (15 seconds)
  max_lifetime: 60 * 30,    // Connections live max 30 minutes
  prepare: false,           // Disable prepared statements for simplicity
  ssl: process.env.DATABASE_SSL === 'true',
  connection: {
    application_name: "ai-agent-generator"
  },
  debug: isDevelopment,
  onnotice: (notice) => {
    logger.debug('Postgres notice:', { notice: notice.message });
  },
  onparameter: (key, value) => {
    logger.debug('Postgres parameter change:', { key, value });
  },
});

// Create the drizzle database instance with schema
export const db = drizzle(pool, { schema });

/**
 * Start a periodic health check of the database connection
 */
export function startHealthCheck(intervalMs = 30000): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      // Simple query to test connection
      await pool`SELECT 1`;
      failedHealthChecks = 0; // Reset on success
      logger.debug('Database health check passed');
    } catch (error) {
      failedHealthChecks++;
      logger.error('Database health check failed', { 
        failedHealthChecks, 
        error 
      });
      
      // If we have several consecutive failures, restart the connection pool
      if (failedHealthChecks >= 3) {
        logger.warn('Multiple database health check failures, attempting to reset pool');
        try {
          await pool.end({ timeout: 5 });
          // Note: The next query will create a new connection automatically
          failedHealthChecks = 0;
        } catch (endError) {
          logger.error('Failed to reset connection pool', endError);
        }
      }
    }
  }, intervalMs);
  
  logger.info('Database health checks started', { intervalMs });
}

/**
 * Stop the periodic health check
 */
export function stopHealthCheck(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Database health checks stopped');
  }
}

// Start health checks in production
if (process.env.NODE_ENV === 'production') {
  startHealthCheck();
}

// Ensure connections are closed on process exit
process.on('beforeExit', async () => {
  logger.info('Closing database connections before exit');
  await pool.end();
  stopHealthCheck();
});

// Handle unhandled promise rejections (especially for database operations)
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled promise rejection:', reason);
  // Don't exit process here to avoid constant restarts
});

// Export the schema for use in other files
export { schema };