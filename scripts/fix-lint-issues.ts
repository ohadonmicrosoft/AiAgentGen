import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";
import { glob } from "glob";

const execAsync = promisify(exec);

// Files with issues that need to be fixed
const FILES_TO_FIX = [
  "client/src/components/TopNav.tsx",
  "client/src/components/StatsCard.tsx",
  "client/src/components/mobile/pull-refresh.tsx",
  "client/src/components/mobile/swipe-container.tsx",
  "client/public/service-worker.js",
  "client/src/components/Sidebar.tsx",
  "client/src/components/ui/__tests__/touch-button.test.tsx",
  "client/src/components/Announcer.tsx",
  "tests/test-memory-cache.ts",
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

async function fixUnusedVariables(
  filePath: string,
  content: string,
): Promise<string> {
  // Fix unused variables by prefixing them with underscore
  const unusedVarRegex = /const\s+(\w+)\s*=/g;
  const unusedParamRegex = /\(([^,)]+)(?::\s*[^,)]+)?\s*(?:,|$)/g;

  // Check for specific unused variables from the linter output
  const unusedVars = [
    { file: "TopNav.tsx", name: "theme" },
    { file: "StatsCard.tsx", name: "start" },
    { file: "pull-refresh.tsx", name: "event" },
    { file: "swipe-container.tsx", name: "event" },
    { file: "Sidebar.tsx", name: "index" },
    { file: "Announcer.tsx", name: "type" },
  ];

  let updatedContent = content;

  // Fix specific unused variables
  for (const { file, name } of unusedVars) {
    if (filePath.includes(file)) {
      // Replace variable declarations
      const varRegex = new RegExp(`(const|let|var)\\s+(${name})\\s*=`, "g");
      updatedContent = updatedContent.replace(varRegex, `$1 _${name} =`);

      // Replace function parameters
      const paramRegex = new RegExp(
        `(\\(|,\\s*)(${name})(\\s*:|\\s*=|\\s*\\))`,
        "g",
      );
      updatedContent = updatedContent.replace(paramRegex, `$1_${name}$3`);
    }
  }

  return updatedContent;
}

async function fixExplicitAny(
  filePath: string,
  content: string,
): Promise<string> {
  // Replace explicit any with more specific types
  if (filePath.includes("touch-button.test.tsx")) {
    // For React components in tests
    // First handle the case with parenthesis
    let updatedContent = content.replace(
      /: any\) =>/g,
      ": React.ComponentProps<any>) =>",
    );
    // Then handle the case without parenthesis
    updatedContent = updatedContent.replace(
      /: any =>/g,
      ": React.ComponentProps<any> =>",
    );
    return updatedContent;
  } else if (filePath.includes("test-memory-cache.ts")) {
    // For error handling in catch clauses - must use 'unknown' instead of 'Error'
    return content.replace(/catch \(error: Error\)/g, "catch (error: unknown)");
  } else if (filePath.includes("Announcer.tsx")) {
    // For items array
    return content.replace(
      /items: any\[\]/g,
      "items: Record<string, unknown>[]",
    );
  }

  return content;
}

async function removeConsoleLog(
  filePath: string,
  content: string,
): Promise<string> {
  // Remove console.log statements
  if (filePath.includes("service-worker.js")) {
    return content.replace(/\s*console\.log\([^)]+\);\s*/g, "\n");
  }

  return content;
}

async function fixFile(filePath: string): Promise<void> {
  try {
    console.log(`Fixing issues in ${filePath}...`);

    // Read file content
    const content = await fs.readFile(filePath, "utf-8");

    // Apply fixes
    let updatedContent = content;
    updatedContent = await fixUnusedVariables(filePath, updatedContent);
    updatedContent = await fixExplicitAny(filePath, updatedContent);
    updatedContent = await removeConsoleLog(filePath, updatedContent);

    // Only write if changes were made
    if (content !== updatedContent) {
      await fs.writeFile(filePath, updatedContent);
      console.log(`✅ Fixed issues in ${filePath}`);
    } else {
      console.log(`ℹ️ No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

async function fixLintIssues() {
  try {
    const projectRoot = process.cwd();
    console.log("Starting to fix specific lint issues...");

    // Create backup
    await createBackup();

    // Fix each file
    for (const file of FILES_TO_FIX) {
      const filePath = path.join(projectRoot, file);
      await fixFile(filePath);
    }

    // Run Biome to format and fix remaining issues
    console.log("\nRunning Biome to format and fix remaining issues...");
    try {
      const biomeConfigPath = path.join(projectRoot, "config", "biome.json");
      const configFlag = `--config-path ${biomeConfigPath}`;

      await execAsync(`npx @biomejs/biome format --write ${configFlag} .`);
      await execAsync(`npx @biomejs/biome lint --apply ${configFlag} .`);

      console.log("✅ Biome formatting and linting completed");
    } catch (error) {
      console.error("Error running Biome:", error);
    }

    console.log("\nLint issue fixes completed!");
  } catch (error) {
    console.error("Error fixing lint issues:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixLintIssues().catch(console.error);
}

export { fixLintIssues };
