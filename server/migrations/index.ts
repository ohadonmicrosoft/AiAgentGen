import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { logger } from '../api/logs';

// Migration tracking table name
const MIGRATION_TABLE = 'drizzle_migrations';

// Maximum retry attempts for migrations
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Run migrations from a specified directory
 */
export async function runMigrations(migrationDir?: string) {
  // Default to the generated migrations directory
  const migrationsDir = migrationDir || path.join(process.cwd(), 'migrations');

  // Check if USE_MOCK_STORAGE is true
  if (process.env.USE_MOCK_STORAGE === 'true') {
    logger.info('Skipping migrations while using mock storage');
    return;
  }

  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is required for migrations',
    );
  }

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    logger.warn(`Migrations directory not found: ${migrationsDir}`);
    return;
  }

  let client: ReturnType<typeof postgres> | null = null;
  let retryAttempts = 0;

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      logger.info('Starting database migration...', {
        migrationsDir,
        attempt: retryAttempts + 1,
      });

      // Create postgres client with specific migration settings
      client = postgres(process.env.DATABASE_URL, {
        max: 1, // Use a single connection for migrations
        idle_timeout: 30, // Allow the connection to be idle longer during migrations
        connect_timeout: 15, // Longer timeout for initial connection
        prepare: false,
        ssl: process.env.DATABASE_SSL === 'true',
      });

      // Test the connection
      await client`SELECT 1`;

      // Create and run the migration
      const db = drizzle(client);
      await migrate(db, {
        migrationsFolder: migrationsDir,
        migrationsTable: MIGRATION_TABLE,
      });

      logger.info('Database migrations completed successfully!');
      return;
    } catch (error: any) {
      retryAttempts++;

      logger.error('Database migration attempt failed', {
        error: error.message,
        code: error.code,
        attempt: retryAttempts,
      });

      // Always close the connection
      if (client) {
        try {
          await client.end();
        } catch (closeErr) {
          logger.error('Error closing database connection', {
            error: closeErr,
          });
        }
        client = null;
      }

      // Retry logic
      if (retryAttempts < MAX_RETRY_ATTEMPTS) {
        logger.info(`Retrying migration in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error('Database migration failed after maximum retry attempts', {
          error,
        });
        throw new Error(
          `Migration failed after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`,
        );
      }
    }
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory() {
  // Check if USE_MOCK_STORAGE is true
  if (process.env.USE_MOCK_STORAGE === 'true') {
    logger.info('Using mock storage - returning empty migration history');
    return [];
  }

  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  let client: ReturnType<typeof postgres> | null = null;
  let retryAttempts = 0;

  while (retryAttempts < MAX_RETRY_ATTEMPTS) {
    try {
      // Create postgres client
      client = postgres(process.env.DATABASE_URL, {
        max: 1,
        connect_timeout: 10,
        ssl: process.env.DATABASE_SSL === 'true',
      });

      // Test connection
      await client`SELECT 1`;

      // Check if migration table exists
      const tableExists = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${MIGRATION_TABLE}
        )
      `;

      if (!tableExists[0].exists) {
        return [];
      }

      // Get migration history
      const migrations = await client`
        SELECT * FROM ${client(MIGRATION_TABLE)} 
        ORDER BY id ASC
      `;

      return migrations;
    } catch (error: any) {
      retryAttempts++;

      logger.error('Failed to get migration history', {
        error: error.message,
        code: error.code,
        attempt: retryAttempts,
      });

      // Always close the connection
      if (client) {
        try {
          await client.end();
        } catch (closeErr) {
          logger.error('Error closing database connection', {
            error: closeErr,
          });
        }
        client = null;
      }

      // Retry logic
      if (retryAttempts < MAX_RETRY_ATTEMPTS) {
        logger.info(`Retrying get migration history in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        throw new Error(
          `Failed to get migration history after ${MAX_RETRY_ATTEMPTS} attempts: ${error.message}`,
        );
      }
    }
  }

  // This should not be reached due to the throw in the loop, but TypeScript needs a return
  return [];
}

/**
 * Check if database is up to date with all migrations
 */
export async function isDatabaseUpToDate(
  migrationDir?: string,
): Promise<boolean> {
  // Check if USE_MOCK_STORAGE is true
  if (process.env.USE_MOCK_STORAGE === 'true') {
    logger.info('Using mock storage - assuming database is up to date');
    return true;
  }

  // Default to the generated migrations directory
  const migrationsDir = migrationDir || path.join(process.cwd(), 'migrations');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    logger.info(
      'No migrations directory found - database is considered up to date',
    );
    return true; // No migrations to apply
  }

  try {
    // Get list of migration files
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      logger.info(
        'No migration files found - database is considered up to date',
      );
      return true; // No migrations to apply
    }

    // Get applied migrations from database
    const appliedMigrations = await getMigrationHistory();

    // Compare counts as a simple check
    const isUpToDate = appliedMigrations.length >= migrationFiles.length;

    if (isUpToDate) {
      logger.info('Database is up to date with all migrations');
    } else {
      logger.info('Database needs migrations', {
        applied: appliedMigrations.length,
        available: migrationFiles.length,
      });
    }

    return isUpToDate;
  } catch (error: any) {
    logger.error('Failed to check database migration status', {
      error: error.message,
      code: error.code,
    });

    // In case of connection failures, we return false to trigger migration attempts
    // which will handle their own retries
    return false;
  }
}
