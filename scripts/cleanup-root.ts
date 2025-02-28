import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Files to be moved to assets directory
const ASSET_FILES = ["generated-icon.png", "fetch-ui.js"];

// Files to be moved to scripts directory
const SCRIPT_FILES = ["migrate.js", "setup-db.ts"];

// Empty directories to be removed
const EMPTY_DIRS_TO_REMOVE = [
  "e2e", // Since we moved its contents to tests/
];

async function createBackup() {
  const projectRoot = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(
    projectRoot,
    "..",
    `AI-Aget-Gen-backup-${timestamp}`,
  );

  console.log("Creating backup...");
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
    if (error.code === "ENOENT") {
      console.log(`File not found: ${sourcePath}`);
    } else {
      console.error(`Error moving ${sourcePath}:`, error);
    }
    return false;
  }
}

async function removeEmptyDirectory(dirPath: string) {
  try {
    // Check if directory exists
    await fs.access(dirPath);

    // Check if directory is empty
    const files = await fs.readdir(dirPath);
    if (files.length === 0) {
      await fs.rmdir(dirPath);
      console.log(`Removed empty directory: ${dirPath}`);
      return true;
    } else {
      console.log(`Directory not empty, skipping: ${dirPath}`);
      return false;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`Directory not found: ${dirPath}`);
    } else {
      console.error(`Error removing directory ${dirPath}:`, error);
    }
    return false;
  }
}

async function cleanupRoot() {
  try {
    const projectRoot = process.cwd();
    console.log("Starting root directory cleanup...");

    // Create backup
    await createBackup();

    // Create assets directory if it doesn't exist
    const assetsDir = path.join(projectRoot, "assets");
    await ensureDirectoryExists(assetsDir);

    // Move asset files
    let movedAssetFiles = 0;
    for (const file of ASSET_FILES) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(assetsDir, path.basename(file));
      const success = await moveFile(sourcePath, destPath);
      if (success) movedAssetFiles++;
    }

    // Move script files
    let movedScriptFiles = 0;
    for (const file of SCRIPT_FILES) {
      const sourcePath = path.join(projectRoot, file);
      const destPath = path.join(projectRoot, "scripts", path.basename(file));
      const success = await moveFile(sourcePath, destPath);
      if (success) movedScriptFiles++;
    }

    // Remove empty directories
    let removedDirs = 0;
    for (const dir of EMPTY_DIRS_TO_REMOVE) {
      const dirPath = path.join(projectRoot, dir);
      const success = await removeEmptyDirectory(dirPath);
      if (success) removedDirs++;
    }

    // Check for .eslintrc.cjs which should be removed since we have eslint.config.js
    try {
      const eslintrcPath = path.join(projectRoot, ".eslintrc.cjs");
      await fs.access(eslintrcPath);
      await fs.unlink(eslintrcPath);
      console.log(`Removed redundant file: ${eslintrcPath}`);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(`Error removing .eslintrc.cjs:`, error);
      }
    }

    console.log("\nRoot directory cleanup completed!");
    console.log(`Moved ${movedAssetFiles} asset files to ${assetsDir}`);
    console.log(`Moved ${movedScriptFiles} script files to scripts directory`);
    console.log(`Removed ${removedDirs} empty directories`);
  } catch (error) {
    console.error("Error during root directory cleanup:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupRoot().catch(console.error);
}

export { cleanupRoot };
