import { exec } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import { promisify } from "util";
import { logger } from "../api/logs";

const execAsync = promisify(exec);

interface MigrationOptions {
  name?: string;
  dryRun?: boolean;
  outputDir?: string;
}

/**
 * Generate migrations by comparing schema against the database
 */
export async function generateMigrations(options: MigrationOptions = {}) {
  const migrationName = options.name || `migration_${Date.now()}`;
  const outputDir = options.outputDir || path.join(process.cwd(), "migrations");
  const dryRun = options.dryRun || false;

  // Check if DATABASE_URL is defined
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  // Ensure migrations directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    logger.info("Generating migration...", {
      migrationName,
      outputDir,
      dryRun,
    });

    // Use drizzle-kit generate command to create migration files
    const command = `npx drizzle-kit generate:pg ${dryRun ? "--dry-run" : ""} --schema=./shared/schema.ts --out=${outputDir}`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      logger.warn("Migration generation warnings:", { stderr });
    }

    logger.info("Migration generation output:", { stdout });

    // If not a dry run and migration was successful, create a timestamp file
    if (!dryRun && !stderr.includes("error")) {
      const timestamp = new Date().toISOString();
      const metaFile = path.join(outputDir, `.meta_${migrationName}`);
      writeFileSync(
        metaFile,
        JSON.stringify(
          {
            name: migrationName,
            timestamp,
            generatedBy: "drizzle-kit",
          },
          null,
          2,
        ),
      );

      logger.info("Migration generated successfully!", { name: migrationName });
    }

    return { success: true, output: stdout };
  } catch (error) {
    logger.error("Migration generation failed", error);
    throw error;
  }
}

// Allow running this directly via CLI
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  const nameArg = args.find((arg) => arg.startsWith("--name="));
  const name = nameArg ? nameArg.split("=")[1] : undefined;
  const dryRun = args.includes("--dry-run");

  generateMigrations({ name, dryRun })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error generating migration:", error); // eslint-disable-line no-console
      process.exit(1);
    });
}
