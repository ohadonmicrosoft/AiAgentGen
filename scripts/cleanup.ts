import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { createInterface } from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Add createBackup function
async function createBackup(projectRoot: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(
    projectRoot,
    '..',
    `AI-Aget-Gen-backup-${timestamp}`,
  );

  console.log('Creating backup...');
  await execAsync(`cp -r "${projectRoot}/." "${backupDir}/"`);
  console.log(`Backup created at: ${backupDir}`);

  return backupDir;
}

// Add ensureGitInitialized function
async function ensureGitInitialized(projectRoot: string) {
  try {
    await fs.access(path.join(projectRoot, '.git'));
  } catch {
    console.log('Git not initialized. Initializing...');
    await execAsync(
      'git init && git add . && git commit -m "Initial commit with project backup"',
      {
        cwd: projectRoot,
      },
    );
    console.log('Git repository initialized with initial commit');
  }
}

// Critical patterns that should never be deleted
const CRITICAL_PATTERNS = [
  // Core app directories
  'client/**',
  'server/**',
  'scripts/**',
  'public/**',
  'src/**',
  'types/**',
  'doc/**',
  '__tests__/**',

  // Config files
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'jest.config.js',
  'tailwind.config.ts',
  '.gitignore',
  '.env.example',

  // Documentation
  'README.md',
  'CHANGELOG.md',
  'LICENSE',

  // Git
  '.git/**',
  '.github/**',
];

// Patterns for files that are safe to remove
const CLEANUP_PATTERNS = [
  // Temporary files
  '**/temp/**',
  '**/tmp/**',
  '**/*.log',

  // Build artifacts
  'dist/**',
  'build/**',
  '.cache/**',
  '.next/**',

  // Development files
  '.vscode/**',
  '.idea/**',
  '*.sublime-*',
  '.DS_Store',
  'Thumbs.db',
  '**/node_modules/.cache/**',
];

const isMainModule = import.meta.url === `file://${process.argv[1]}`;

async function cleanup() {
  try {
    const projectRoot = process.cwd();

    // Create backup before proceeding
    const backupDir = await createBackup(projectRoot);

    // Ensure Git is initialized
    await ensureGitInitialized(projectRoot);

    // Update critical directories check
    const criticalDirs = ['client']; // Change this line to only check for client directory initially
    for (const dir of criticalDirs) {
      try {
        await fs.access(path.join(projectRoot, dir));
      } catch {
        console.error(`CRITICAL ERROR: ${dir} directory is missing!`);
        console.error(`Backup available at: ${backupDir}`);
        process.exit(1);
      }
    }

    console.log('Starting cleanup process...');
    console.log(`Project root: ${projectRoot}`);

    // Get all files in the project
    const allFiles = await glob('**/*', {
      dot: true,
      ignore: ['node_modules/**'],
      cwd: projectRoot,
    });

    // Get critical files that should be kept
    const criticalFiles = new Set(
      (
        await Promise.all(
          CRITICAL_PATTERNS.map((pattern) =>
            glob(pattern, { dot: true, cwd: projectRoot }),
          ),
        )
      ).flat(),
    );

    // Get cleanup files that should be removed
    const cleanupFiles = new Set(
      (
        await Promise.all(
          CLEANUP_PATTERNS.map((pattern) =>
            glob(pattern, { dot: true, cwd: projectRoot }),
          ),
        )
      ).flat(),
    );

    // Files to be removed are those that are either cleanup or not critical
    const filesToRemove = allFiles.filter(
      (file) => cleanupFiles.has(file) || !criticalFiles.has(file),
    );

    // Generate report
    console.log('\nFiles to be removed:');
    filesToRemove.forEach((file) => {
      console.log(`- ${file}`);
    });

    // Add additional safety check before deletion
    if (
      filesToRemove.some((file) =>
        criticalDirs.some((dir) => file.startsWith(dir)),
      )
    ) {
      console.error(
        'SAFETY CHECK FAILED: Attempted to remove protected directory!',
      );
      console.error('Cleanup cancelled.');
      process.exit(1);
    }

    // Confirm with user
    if (process.env.NODE_ENV !== 'test') {
      const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        readline.question(
          'Do you want to proceed with deletion? (y/N) ',
          resolve,
        );
      });
      readline.close();

      if (answer.toLowerCase() !== 'y') {
        console.log('Cleanup cancelled.');
        return;
      }
    }

    // Remove files
    let removedCount = 0;
    let errorCount = 0;

    for (const file of filesToRemove) {
      const fullPath = path.join(projectRoot, file);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive: true });
        } else {
          await fs.unlink(fullPath);
        }
        removedCount++;
        console.log(`Removed: ${file}`);
      } catch (error) {
        console.error(`Error removing ${file}:`, error);
        errorCount++;
      }
    }

    // Remove empty directories
    await removeEmptyDirs(projectRoot);

    console.log('\nCleanup completed!');
    console.log(`Successfully removed ${removedCount} files/directories`);
    if (errorCount > 0) {
      console.log(`Failed to remove ${errorCount} files/directories`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
    console.error('Please restore from the latest backup if needed');
    process.exit(1);
  }
}

async function removeEmptyDirs(dir: string) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      await removeEmptyDirs(fullPath);

      // Check if directory is empty after processing subdirectories
      const remainingFiles = await fs.readdir(fullPath);
      if (remainingFiles.length === 0) {
        await fs.rmdir(fullPath);
        console.log(
          `Removed empty directory: ${path.relative(process.cwd(), fullPath)}`,
        );
      }
    }
  }
}

// Run the cleanup if this script is executed directly
if (isMainModule) {
  cleanup().catch(console.error);
}

export { cleanup };
