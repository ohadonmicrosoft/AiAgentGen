import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { logger } from './api/logs';

// Create a mock for the postgres client
class MockPostgresClient {
  // This method mimics the tagged template behavior of postgres
  async query(...args: any[]) {
    logger.debug('[Mock DB] Query received:', { args });
    // Return an empty array for any query
    return [];
  }

  // Mock the sql template literal tag function
  sql(strings: TemplateStringsArray, ...values: any[]) {
    logger.debug('[Mock DB] SQL template:', {
      strings: strings.join(''),
      values,
    });
    return [];
  }

  // Add mock for end method
  async end() {
    logger.debug('[Mock DB] Connection pool ended');
    return true;
  }

  // Make the mock callable like a template literal function
  async(...args: any[]) {
    logger.debug('[Mock DB] Template query:', { args });
    return [];
  }
}

// For development testing, allow running without a real database
const useMockStorage = process.env.USE_MOCK_STORAGE === 'true';
const isDevelopmentTesting = !process.env.DATABASE_URL || useMockStorage;

// Create either a real or mock postgres client
let pool: any;
let db: any;

/**
 * Initialize the database connection with retry mechanism
 */
async function initializeDatabase() {
  if (isDevelopmentTesting) {
    logger.info(
      '[DB] Using mock database for testing - no actual PostgreSQL connection will be made',
    );

    // Create a mock postgres client
    pool = new MockPostgresClient();

    // Create a mock drizzle instance
    db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
            execute: () => Promise.resolve([]),
          }),
          execute: () => Promise.resolve([]),
        }),
      }),
      insert: () => ({
        values: () => ({
          returning: () => Promise.resolve([]),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
      }),
      delete: () => ({
        where: () => Promise.resolve(),
      }),
      query: {
        raw: () => Promise.resolve([]),
      },
    };

    return { pool, db };
  } else {
    // Environment-based pool configuration
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const MAX_CONNECTIONS = isDevelopment ? 5 : 20;
    const IDLE_TIMEOUT = isDevelopment ? 20 : 60; // seconds
    const MAX_RETRY_ATTEMPTS = 5;
    const RETRY_DELAY_MS = 2000;

    let retryAttempt = 0;
    let lastError: Error | null = null;

    while (retryAttempt < MAX_RETRY_ATTEMPTS) {
      try {
        // Create a real postgres connection pool with improved settings
        const newPool = postgres(process.env.DATABASE_URL!, {
          max: MAX_CONNECTIONS,
          idle_timeout: IDLE_TIMEOUT,
          connect_timeout: 20, // Increased connection timeout (20 seconds)
          max_lifetime: 60 * 60, // Connections live max 60 minutes
          prepare: false, // Disable prepared statements for simplicity
          ssl: process.env.DATABASE_SSL === 'true',
          connection: {
            application_name: 'ai-agent-generator',
          },
          debug: isDevelopment,
          onnotice: (notice) => {
            logger.debug('Postgres notice:', { notice: notice.message });
          },
          onparameter: (key, value) => {
            logger.debug('Postgres parameter change:', { key, value });
          },
          // Add retry logic for connection errors
          onretry: (err, attempts) => {
            logger.warn(
              `Connection error, retrying (${attempts}/${MAX_CONNECTIONS * 2})`,
              {
                error: err.message,
              },
            );
            return true; // Continue retrying
          },
        });

        // Test the connection
        await newPool`SELECT 1`;

        // Connection successful, assign to pool and create drizzle instance
        pool = newPool;
        db = drizzle(pool, { schema });

        logger.info('[DB] Database connection established successfully');
        return { pool, db };
      } catch (error: any) {
        lastError = error;
        retryAttempt++;

        logger.error(
          `[DB] Database connection attempt ${retryAttempt}/${MAX_RETRY_ATTEMPTS} failed`,
          {
            error: error.message,
            code: error.code,
          },
        );

        if (retryAttempt < MAX_RETRY_ATTEMPTS) {
          logger.info(`[DB] Retrying in ${RETRY_DELAY_MS}ms...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    // All retry attempts failed
    logger.error(
      '[DB] Failed to establish database connection after multiple attempts',
      {
        lastError,
      },
    );

    // Fallback to mock in development, but throw in production
    if (isDevelopment) {
      logger.warn(
        '[DB] Falling back to mock database since connection failed in development mode',
      );

      // Create a mock postgres client as fallback
      pool = new MockPostgresClient();

      // Create a mock drizzle instance
      db = {
        // ... same mock implementation as above
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => Promise.resolve([]),
              execute: () => Promise.resolve([]),
            }),
            execute: () => Promise.resolve([]),
          }),
        }),
        insert: () => ({
          values: () => ({
            returning: () => Promise.resolve([]),
          }),
        }),
        update: () => ({
          set: () => ({
            where: () => ({
              returning: () => Promise.resolve([]),
            }),
          }),
        }),
        delete: () => ({
          where: () => Promise.resolve(),
        }),
        query: {
          raw: () => Promise.resolve([]),
        },
      };

      return { pool, db };
    } else {
      throw new Error(
        'Failed to establish database connection in production environment',
      );
    }
  }
}

// Initialize database connection
initializeDatabase()
  .then(({ pool: p, db: d }) => {
    pool = p;
    db = d;

    // Start health checks if using real database
    if (!isDevelopmentTesting && process.env.NODE_ENV === 'production') {
      startHealthCheck();
    }
  })
  .catch((err) => {
    logger.error('Failed to initialize database', { error: err.message });
    // Don't exit process here as we have fallback mechanisms
  });

// Export the pool and db instance (either real or mock)
export { pool, db };

// Connection health monitoring - only used with real DB
let healthCheckInterval: NodeJS.Timeout | null = null;
let failedHealthChecks = 0;

/**
 * Start a periodic health check of the database connection
 */
export function startHealthCheck(intervalMs = 30000): void {
  if (isDevelopmentTesting) {
    logger.info('[DB] Health checks skipped in test mode');
    return;
  }

  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    try {
      // Simple query to test connection
      await pool`SELECT 1`;

      // Reset counter on successful check
      if (failedHealthChecks > 0) {
        logger.info(
          `Database connection recovered after ${failedHealthChecks} failed health checks`,
        );
      }
      failedHealthChecks = 0; // Reset on success
      logger.debug('Database health check passed');
    } catch (error) {
      failedHealthChecks++;
      logger.error('Database health check failed', {
        failedHealthChecks,
        error,
      });

      // If we have several consecutive failures, restart the connection pool
      if (failedHealthChecks >= 3) {
        logger.warn(
          'Multiple database health check failures, attempting to reset pool',
        );
        try {
          await pool.end({ timeout: 5 });

          // Reinitialize the connection
          const { pool: newPool, db: newDb } = await initializeDatabase();
          pool = newPool;
          db = newDb;

          logger.info('Database connection pool reset successfully');
          failedHealthChecks = 0;
        } catch (endError) {
          logger.error('Failed to reset connection pool', { error: endError });
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

// Ensure connections are closed on process exit (if not in test mode)
if (!isDevelopmentTesting) {
  process.on('beforeExit', async () => {
    logger.info('Closing database connections before exit');
    await pool.end();
    stopHealthCheck();
  });
}

// Set up error handling for database-related errors
process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception:', { error: err.message, stack: err.stack });

  // If connection errors persist, try to recover rather than exiting
  if (
    err.message.includes('connect ECONNREFUSED') ||
    err.message.includes('too many clients') ||
    err.message.includes('Failed to acquire permit')
  ) {
    logger.warn('Database connection issues detected, attempting recovery');

    // Try to reset the connection pool
    initializeDatabase()
      .then(({ pool: newPool, db: newDb }) => {
        pool = newPool;
        db = newDb;
        logger.info('Database connection recovered after error');
      })
      .catch((recoveryErr) => {
        logger.error('Failed to recover database connection', {
          error: recoveryErr.message,
        });
        // In production, exit after failed recovery to let the system restart
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
      });
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  if (reason instanceof Error) {
    logger.error('Unhandled promise rejection:', {
      error: reason.message,
      stack: reason.stack,
    });
  } else {
    logger.error('Unhandled promise rejection with non-error reason:', {
      reason,
    });
  }
  // Don't exit process here to avoid constant restarts
});

// Export the schema for use in other files
export { schema };
