import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";
import { glob } from "glob";

const execAsync = promisify(exec);

// Files with issues that need to be fixed
const FILES_TO_FIX = [
  "client/src/components/QuickActionCard.tsx",
  "assets/fetch-ui.js",
  "client/src/components/TopNav.tsx",
  "client/src/components/ui/__tests__/offline-indicator.test.tsx",
  "client/src/components/ui/__tests__/touch-button.test.tsx",
  "client/src/components/ui/calendar.tsx",
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
  let updatedContent = content;

  // Fix specific unused variables based on the linting output
  if (filePath.includes("QuickActionCard.tsx")) {
    updatedContent = updatedContent.replace(
      /const\s+\{\s*buttonHover,\s*buttonTap\s*\}\s*=\s*useMicroInteractions\(\);/g,
      "const { _buttonHover, _buttonTap } = useMicroInteractions();",
    );
  }

  if (filePath.includes("TopNav.tsx")) {
    updatedContent = updatedContent.replace(
      /const\s+\{\s*theme\s*\}\s*=\s*useTheme\(\);/g,
      "const { _theme } = useTheme();",
    );
  }

  if (filePath.includes("offline-indicator.test.tsx")) {
    updatedContent = updatedContent.replace(
      /catch\s+\(error\)/g,
      "catch (_error)",
    );
  }

  if (filePath.includes("calendar.tsx")) {
    updatedContent = updatedContent.replace(
      /IconLeft:\s+\(\{\s*\.\.\.(props)\s*\}\)\s*=>/g,
      "IconLeft: ({ ..._$1 }) =>",
    );
    updatedContent = updatedContent.replace(
      /IconRight:\s+\(\{\s*\.\.\.(props)\s*\}\)\s*=>/g,
      "IconRight: ({ ..._$1 }) =>",
    );
  }

  return updatedContent;
}

async function fixExplicitAny(
  filePath: string,
  content: string,
): Promise<string> {
  let updatedContent = content;

  if (filePath.includes("touch-button.test.tsx")) {
    // Replace explicit any with more specific types
    updatedContent = updatedContent.replace(
      /React\.ComponentProps<any>/g,
      'React.ComponentProps<"div">',
    );
  }

  return updatedContent;
}

async function removeConsoleLog(
  filePath: string,
  content: string,
): Promise<string> {
  let updatedContent = content;

  if (
    filePath.includes("fetch-ui.js") ||
    filePath.includes("test-memory-cache.ts")
  ) {
    // Comment out console.log statements instead of removing them
    updatedContent = updatedContent.replace(/(console\.log\(.*?\);)/g, "// $1");
  }

  return updatedContent;
}

async function fixFile(filePath: string): Promise<void> {
  try {
    console.log(`Fixing issues in ${filePath}...`);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      console.log(`⚠️ File not found: ${filePath}`);
      return;
    }

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

async function fixRemainingIssues() {
  try {
    const projectRoot = process.cwd();
    console.log("Starting to fix remaining lint issues...");

    // Create backup
    await createBackup();

    // Fix each file
    for (const file of FILES_TO_FIX) {
      const filePath = path.join(projectRoot, file);
      await fixFile(filePath);
    }

    // Create ESLint config if missing
    const eslintConfigPath = path.join(projectRoot, ".eslintrc.json");
    try {
      await fs.access(eslintConfigPath);
      console.log("ESLint config exists, skipping creation");
    } catch (error) {
      console.log("Creating ESLint config...");
      const eslintConfig = {
        extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "plugin:react/recommended",
          "plugin:react-hooks/recommended",
        ],
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint", "react", "react-hooks"],
        root: true,
        env: {
          browser: true,
          node: true,
          es6: true,
        },
        settings: {
          react: {
            version: "detect",
          },
        },
        rules: {
          "no-console": "warn",
          "@typescript-eslint/no-explicit-any": "warn",
          "@typescript-eslint/no-unused-vars": [
            "warn",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
          ],
        },
      };

      await fs.writeFile(
        eslintConfigPath,
        JSON.stringify(eslintConfig, null, 2),
      );
      console.log(`✅ Created ESLint config at ${eslintConfigPath}`);
    }

    // Run Biome to format and fix remaining issues
    console.log("\nRunning Biome to format and fix remaining issues...");
    try {
      const biomeConfigPath = path.join(projectRoot, "config", "biome.json");
      const configFlag = `--config-path ${biomeConfigPath}`;

      await execAsync(`npx @biomejs/biome format --write ${configFlag} .`);
      await execAsync(`npx @biomejs/biome lint --write ${configFlag} .`);

      console.log("✅ Biome formatting and linting completed");
    } catch (error) {
      console.error("Error running Biome:", error);
    }

    console.log("\nRemaining lint issue fixes completed!");
  } catch (error) {
    console.error("Error fixing remaining lint issues:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixRemainingIssues().catch(console.error);
}

export { fixRemainingIssues };
