import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';

const execAsync = promisify(exec);

// Files to be moved to config directory
const CONFIG_FILES = [
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'tsconfig.json',
  'jest.config.js',
  'jest.integration.config.js',
  'jest.server.config.js',
  'jest.setup.js',
  'lighthouserc.js',
  'drizzle.config.ts',
  'biome.json',
  'eslint.config.js',
  '.prettierrc.json',
  'playwright.config.ts',
  'theme.json'
];

// Files to be moved to tests directory
const TEST_FILES = [
  'test-memory-cache.ts',
  'e2e/**/*'
];

// Files that should remain in the root directory
const ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'README.md',
  '.gitignore',
  '.env',
  'implementation-plan.md'
];

async function createBackup() {
  const projectRoot = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(projectRoot, '..', `AI-Aget-Gen-backup-${timestamp}`);
  
  console.log('Creating backup...');
  await execAsync(`cp -r "${projectRoot}/." "${backupDir}/"`);
  console.log(`Backup created at: ${backupDir}`);
  
  return backupDir;
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

async function moveFile(sourcePath: string, destPath: string) {
  try {
    // Ensure the destination directory exists
    const destDir = path.dirname(destPath);
    await ensureDirectoryExists(destDir);
    
    // Copy the file to the new location
    await fs.copyFile(sourcePath, destPath);
    
    // Remove the original file
    await fs.unlink(sourcePath);
    
    console.log(`Moved: ${sourcePath} -> ${destPath}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${sourcePath}`);
    } else {
      console.error(`Error moving ${sourcePath}:`, error);
    }
    return false;
  }
}

async function updateImportPaths(filePath: string, oldPath: string, newPath: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const updatedContent = content.replace(
      new RegExp(`from ['"]${oldPath}['"]`, 'g'),
      `from '${newPath}'`
    );
    
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating imports in ${filePath}:`, error);
  }
}

async function updatePackageJsonScripts(configDir: string) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    
    // Update paths in scripts
    for (const [key, value] of Object.entries(packageJson.scripts)) {
      if (typeof value === 'string') {
        // Update jest config paths
        let updatedValue = value
          .replace(/--config=jest\.config\.js/g, `--config=${configDir}/jest.config.js`)
          .replace(/--config=jest\.integration\.config\.js/g, `--config=${configDir}/jest.integration.config.js`)
          .replace(/--config=jest\.server\.config\.js/g, `--config=${configDir}/jest.server.config.js`);
        
        // Update other config references
        CONFIG_FILES.forEach(file => {
          const fileName = path.basename(file);
          updatedValue = updatedValue.replace(
            new RegExp(`\\b${fileName}\\b`, 'g'),
            `${configDir}/${fileName}`
          );
        });
        
        packageJson.scripts[key] = updatedValue;
      }
    }
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated package.json scripts with new config paths');
  } catch (error) {
    console.error('Error updating package.json:', error);
  }
}

async function organizeProject() {
  try {
    const projectRoot = process.cwd();
    console.log('Starting project organization...');
    
    // Create backup
    await createBackup();
    
    // Create directories if they don't exist
    const configDir = path.join(projectRoot, 'config');
    const testsDir = path.join(projectRoot, 'tests');
    
    await ensureDirectoryExists(configDir);
    await ensureDirectoryExists(testsDir);
    
    // Move config files
    let movedConfigFiles = 0;
    for (const file of CONFIG_FILES) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(configDir, path.basename(file));
      const success = await moveFile(sourcePath, destPath);
      if (success) movedConfigFiles++;
    }
    
    // Move test files
    let movedTestFiles = 0;
    for (const pattern of TEST_FILES) {
      const files = await glob(pattern, { cwd: projectRoot });
      for (const file of files) {
        const sourcePath = path.join(projectRoot, file);
        const destPath = path.join(testsDir, file.replace(/^e2e\//, ''));
        const success = await moveFile(sourcePath, destPath);
        if (success) movedTestFiles++;
      }
    }
    
    // Update package.json scripts to reference new config locations
    await updatePackageJsonScripts('config');
    
    // Update tsconfig.json to include new directories
    const tsconfigPath = path.join(configDir, 'tsconfig.json');
    try {
      const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
      if (tsconfig.include) {
        tsconfig.include = [...new Set([...tsconfig.include, 'tests/**/*'])];
      }
      await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log('Updated tsconfig.json to include tests directory');
    } catch (error) {
      console.error('Error updating tsconfig.json:', error);
    }
    
    console.log('\nProject organization completed!');
    console.log(`Moved ${movedConfigFiles} config files to ${configDir}`);
    console.log(`Moved ${movedTestFiles} test files to ${testsDir}`);
    
  } catch (error) {
    console.error('Error during project organization:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  organizeProject().catch(console.error);
}

export { organizeProject }; 