import fs from 'fs';
import path from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { logger } from '../api/logs';

// Migration tracking table name
const MIGRATION_TABLE = 'drizzle_migrations';

/**
 * Run migrations from a specified directory
 */
export async function runMigrations(migrationDir?: string) {
  // Default to the generated migrations directory
  const migrationsDir = migrationDir || path.join(process.cwd(), 'migrations');
  
  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    logger.warn(`Migrations directory not found: ${migrationsDir}`);
    return;
  }

  let client: ReturnType<typeof postgres> | null = null;
  
  try {
    logger.info('Starting database migration...', { migrationsDir });
    
    // Create postgres client with specific migration settings
    client = postgres(process.env.DATABASE_URL, {
      max: 1, // Use a single connection for migrations
      idle_timeout: 30, // Allow the connection to be idle longer during migrations
      connect_timeout: 10,
    });
    
    // Create and run the migration
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: migrationsDir, migrationsTable: MIGRATION_TABLE });
    
    logger.info('Database migrations completed successfully!');
  } catch (error) {
    logger.error('Database migration failed', error);
    throw error;
  } finally {
    // Always close the connection
    if (client) {
      await client.end();
    }
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory() {
  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  
  let client: ReturnType<typeof postgres> | null = null;
  
  try {
    // Create postgres client
    client = postgres(process.env.DATABASE_URL);
    
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
  } catch (error) {
    logger.error('Failed to get migration history', error);
    throw error;
  } finally {
    // Always close the connection
    if (client) {
      await client.end();
    }
  }
}

/**
 * Check if database is up to date with all migrations
 */
export async function isDatabaseUpToDate(migrationDir?: string): Promise<boolean> {
  // Default to the generated migrations directory
  const migrationsDir = migrationDir || path.join(process.cwd(), 'migrations');
  
  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    return true; // No migrations to apply
  }
  
  try {
    // Get list of migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      return true; // No migrations to apply
    }
    
    // Get applied migrations from database
    const appliedMigrations = await getMigrationHistory();
    
    // Compare counts as a simple check
    return appliedMigrations.length === migrationFiles.length;
  } catch (error) {
    logger.error('Failed to check database migration status', error);
    return false;
  }
} 