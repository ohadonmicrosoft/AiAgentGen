import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Comprehensive maintenance script for the AI Agent Generator project
 * This script combines functionality from multiple maintenance scripts
 */

// Fix React JSX imports
async function fixReactJSXIssues(): Promise<void> {
  console.log("Fixing React JSX issues...");

  try {
    // Find all JSX/TSX files
    const jsxFiles = findFiles(["client/src/**/*.tsx", "client/src/**/*.jsx"]);

    let fixedCount = 0;

    for (const file of jsxFiles) {
      const content = fs.readFileSync(file, "utf8");

      // Check if file contains JSX but doesn't import React
      if (
        (content.includes("<") && content.includes("/>")) ||
        content.includes("</") ||
        content.includes("className=")
      ) {
        if (
          !content.includes("import React") &&
          !content.includes('from "react"')
        ) {
          // Add React import at the top of the file
          const newContent = `import React from "react";\n${content}`;
          fs.writeFileSync(file, newContent, "utf8");
          fixedCount++;
          console.log(`Added React import to ${file}`);
        }
      }
    }

    console.log(`Fixed React imports in ${fixedCount} files`);
  } catch (error) {
    console.error("Error fixing React JSX issues:", error);
  }
}

// Fix broken imports
async function fixBrokenImports(): Promise<void> {
  console.log("Fixing broken import statements...");

  try {
    // Find all TSX files
    const tsxFiles = findFiles(["client/src/**/*.tsx"]);

    let fixedCount = 0;

    for (const file of tsxFiles) {
      const content = fs.readFileSync(file, "utf8");

      // Check if file has broken import
      if (content.includes("import {\nimport React from")) {
        // Fix the broken import by removing the React import line
        const fixedContent = content.replace(
          /import \{\nimport React from "react";\n/,
          "import {\n",
        );

        // Add React import at the top
        const finalContent = `import React from "react";\n${fixedContent}`;

        fs.writeFileSync(file, finalContent, "utf8");
        fixedCount++;
        console.log(`Fixed broken import in ${file}`);
      }
    }

    console.log(`Fixed broken imports in ${fixedCount} files`);
  } catch (error) {
    console.error("Error fixing broken imports:", error);
  }
}

// Helper function to find files matching patterns
function findFiles(patterns: string[]): string[] {
  let files: string[] = [];

  for (const pattern of patterns) {
    try {
      const result = execSync(`npx glob "${pattern}"`, { encoding: "utf8" });
      const foundFiles = result.trim().split("\n").filter(Boolean);
      files = [...files, ...foundFiles];
    } catch (error) {
      console.error(`Error finding files with pattern ${pattern}:`, error);
    }
  }

  return files;
}

// Run all maintenance tasks
async function main(): Promise<void> {
  console.log("Running maintenance tasks...");

  await fixReactJSXIssues();
  await fixBrokenImports();

  console.log("Maintenance tasks completed successfully!");
}

main().catch(console.error);
