import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Files to be removed (redundant or temporary files)
const filesToRemove = [
  // Redundant script files
  "scripts/fix-code.ts",
  "scripts/fix-lint-issues.ts",
  "scripts/lint-fix.ts",
  "scripts/organize-project.ts",
  "scripts/remove-redundant.ts",
  "scripts/map-project.ts",
  "scripts/cleanup.ts",
  "scripts/cleanup-root.ts",

  // Backup files
  ".eslintrc.json.backup",

  // Temporary files
  "implementation-plan.md",
  "project-structure.md",

  // Redundant config files (keep only the ones we need)
  "config/eslint.config.js", // We're using .eslintrc.json in the root
];

// Directories to clean up (remove empty directories or unnecessary files)
const directoriesToClean = [
  "attached_assets", // If this is just for documentation and not needed for the app
];

// Function to safely remove a file
function safeRemoveFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed file: ${filePath}`);
    } else {
      console.log(`File does not exist: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error removing file ${filePath}:`, error);
  }
}

// Function to safely remove a directory
function safeRemoveDirectory(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      if (fs.readdirSync(dirPath).length === 0) {
        // Directory is empty
        fs.rmdirSync(dirPath);
        console.log(`Removed empty directory: ${dirPath}`);
      } else {
        console.log(`Directory not empty, skipping: ${dirPath}`);
      }
    } else {
      console.log(`Directory does not exist: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error removing directory ${dirPath}:`, error);
  }
}

// Function to consolidate maintenance scripts
function consolidateMaintenanceScripts(): void {
  // Create a single maintenance script that includes all necessary functionality
  const maintenanceScriptContent = `import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Comprehensive maintenance script for the AI Agent Generator project
 * This script combines functionality from multiple maintenance scripts
 */

// Fix React JSX imports
async function fixReactJSXIssues(): Promise<void> {
  console.log('Fixing React JSX issues...');
  
  try {
    // Find all JSX/TSX files
    const jsxFiles = findFiles(['client/src/**/*.tsx', 'client/src/**/*.jsx']);
    
    let fixedCount = 0;
    
    for (const file of jsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file contains JSX but doesn't import React
      if ((content.includes('<') && content.includes('/>')) || 
          content.includes('</') || 
          content.includes('className=')) {
        
        if (!content.includes('import React') && !content.includes('from "react"')) {
          // Add React import at the top of the file
          const newContent = \`import React from "react";\\n\${content}\`;
          fs.writeFileSync(file, newContent, 'utf8');
          fixedCount++;
          console.log(\`Added React import to \${file}\`);
        }
      }
    }
    
    console.log(\`Fixed React imports in \${fixedCount} files\`);
  } catch (error) {
    console.error('Error fixing React JSX issues:', error);
  }
}

// Fix broken imports
async function fixBrokenImports(): Promise<void> {
  console.log('Fixing broken import statements...');
  
  try {
    // Find all TSX files
    const tsxFiles = findFiles(['client/src/**/*.tsx']);
    
    let fixedCount = 0;
    
    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check if file has broken import
      if (content.includes('import {\\nimport React from')) {
        // Fix the broken import by removing the React import line
        const fixedContent = content.replace(/import \\{\\nimport React from "react";\\n/, 'import {\\n');
        
        // Add React import at the top
        const finalContent = \`import React from "react";\\n\${fixedContent}\`;
        
        fs.writeFileSync(file, finalContent, 'utf8');
        fixedCount++;
        console.log(\`Fixed broken import in \${file}\`);
      }
    }
    
    console.log(\`Fixed broken imports in \${fixedCount} files\`);
  } catch (error) {
    console.error('Error fixing broken imports:', error);
  }
}

// Helper function to find files matching patterns
function findFiles(patterns: string[]): string[] {
  let files: string[] = [];
  
  for (const pattern of patterns) {
    try {
      const result = execSync(\`npx glob "\${pattern}"\`, { encoding: 'utf8' });
      const foundFiles = result.trim().split('\\n').filter(Boolean);
      files = [...files, ...foundFiles];
    } catch (error) {
      console.error(\`Error finding files with pattern \${pattern}:\`, error);
    }
  }
  
  return files;
}

// Run all maintenance tasks
async function main(): Promise<void> {
  console.log('Running maintenance tasks...');
  
  await fixReactJSXIssues();
  await fixBrokenImports();
  
  console.log('Maintenance tasks completed successfully!');
}

main().catch(console.error);
`;

  fs.writeFileSync("scripts/maintain.ts", maintenanceScriptContent, "utf8");
  console.log("Created consolidated maintenance script: scripts/maintain.ts");
}

// Main function to clean up the project
async function cleanupProject(): Promise<void> {
  console.log("Starting project cleanup...");

  // Remove redundant files
  for (const file of filesToRemove) {
    safeRemoveFile(file);
  }

  // Clean up directories
  for (const dir of directoriesToClean) {
    safeRemoveDirectory(dir);
  }

  // Consolidate maintenance scripts
  consolidateMaintenanceScripts();

  console.log("Project cleanup completed successfully!");
}

// Run the cleanup
cleanupProject().catch(console.error);
