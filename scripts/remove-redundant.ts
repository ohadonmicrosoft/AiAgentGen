import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Files to be removed
const REDUNDANT_FILES = [
  'test-memory-cache.js',
  'setup-db.js',
  // Add any other redundant files here
];

async function removeRedundantFiles() {
  try {
    const projectRoot = process.cwd();
    console.log('Starting removal of redundant files...');
    
    // Create a backup first
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(projectRoot, '..', `AI-Aget-Gen-backup-${timestamp}`);
    
    console.log('Creating backup...');
    await execAsync(`cp -r "${projectRoot}/." "${backupDir}/"`);
    console.log(`Backup created at: ${backupDir}`);

    // Remove redundant files
    let removedCount = 0;
    let errorCount = 0;

    for (const file of REDUNDANT_FILES) {
      const fullPath = path.join(projectRoot, file);
      try {
        await fs.access(fullPath);
        await fs.unlink(fullPath);
        removedCount++;
        console.log(`Removed: ${file}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`File not found: ${file}`);
        } else {
          console.error(`Error removing ${file}:`, error);
          errorCount++;
        }
      }
    }

    console.log('\nRedundant file removal completed!');
    console.log(`Successfully removed ${removedCount} files`);
    if (errorCount > 0) {
      console.log(`Failed to remove ${errorCount} files`);
    }
  } catch (error) {
    console.error('Error during file removal:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  removeRedundantFiles().catch(console.error);
}

export { removeRedundantFiles }; 