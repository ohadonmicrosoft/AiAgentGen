import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";
import { glob } from "glob";

const execAsync = promisify(exec);

// Directories to exclude from linting
const EXCLUDE_DIRS = ["node_modules", "dist", "build", ".git", "coverage"];

// File extensions to include in linting
const INCLUDE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"];

interface LintResult {
  tool: string;
  success: boolean;
  output: string;
  error?: string;
}

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

async function runCommand(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(command);
  } catch (error) {
    // If the command fails, we still want to continue with other linting steps
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || error.message,
    };
  }
}

async function runESLint(): Promise<LintResult> {
  console.log("Running ESLint with auto-fix...");

  try {
    const { stdout, stderr } = await runCommand(
      "npx eslint --ext .ts,.tsx,.js,.jsx --fix .",
    );

    return {
      tool: "ESLint",
      success: !stderr,
      output: stdout,
      error: stderr || undefined,
    };
  } catch (error) {
    return {
      tool: "ESLint",
      success: false,
      output: "",
      error: error.message,
    };
  }
}

async function runBiome(): Promise<LintResult> {
  console.log("Running Biome with auto-fix...");

  try {
    // First check if biome.json exists
    const biomeConfigPath = path.join(process.cwd(), "config", "biome.json");
    const rootBiomeConfigPath = path.join(process.cwd(), "biome.json");

    let configPath = "";
    try {
      await fs.access(biomeConfigPath);
      configPath = biomeConfigPath;
    } catch {
      try {
        await fs.access(rootBiomeConfigPath);
        configPath = rootBiomeConfigPath;
      } catch {
        console.log("No Biome config found, creating a default one...");
        // Create a default biome.json in the config directory
        const defaultConfig = {
          $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
          organizeImports: {
            enabled: true,
          },
          linter: {
            enabled: true,
            rules: {
              recommended: true,
            },
          },
          formatter: {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
            lineWidth: 100,
          },
          javascript: {
            formatter: {
              quoteStyle: "single",
              trailingComma: "es5",
              semicolons: "always",
            },
          },
        };

        await fs.mkdir(path.dirname(biomeConfigPath), { recursive: true });
        await fs.writeFile(
          biomeConfigPath,
          JSON.stringify(defaultConfig, null, 2),
        );
        configPath = biomeConfigPath;
      }
    }

    const configFlag = configPath ? `--config-path ${configPath}` : "";

    // Run Biome format first
    const formatResult = await runCommand(
      `npx @biomejs/biome format --write ${configFlag} .`,
    );

    // Then run Biome lint with auto-fix
    const lintResult = await runCommand(
      `npx @biomejs/biome lint --apply ${configFlag} .`,
    );

    return {
      tool: "Biome",
      success: !formatResult.stderr && !lintResult.stderr,
      output: formatResult.stdout + "\n" + lintResult.stdout,
      error: formatResult.stderr || lintResult.stderr || undefined,
    };
  } catch (error) {
    return {
      tool: "Biome",
      success: false,
      output: "",
      error: error.message,
    };
  }
}

async function runPrettier(): Promise<LintResult> {
  console.log("Running Prettier with auto-fix...");

  try {
    // Check if prettier config exists
    const prettierConfigPath = path.join(
      process.cwd(),
      "config",
      ".prettierrc.json",
    );
    const rootPrettierConfigPath = path.join(process.cwd(), ".prettierrc.json");

    let configPath = "";
    try {
      await fs.access(prettierConfigPath);
      configPath = prettierConfigPath;
    } catch {
      try {
        await fs.access(rootPrettierConfigPath);
        configPath = rootPrettierConfigPath;
      } catch {
        // No config found, will use Prettier defaults
      }
    }

    const configFlag = configPath ? `--config ${configPath}` : "";

    // Get all files to format
    const files = await glob("**/*.{ts,tsx,js,jsx,json,md,css,scss,html}", {
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    });

    if (files.length === 0) {
      return {
        tool: "Prettier",
        success: true,
        output: "No files found to format.",
      };
    }

    // Run Prettier on all files
    const { stdout, stderr } = await runCommand(
      `npx prettier ${configFlag} --write ${files.join(" ")}`,
    );

    return {
      tool: "Prettier",
      success: !stderr,
      output: stdout,
      error: stderr || undefined,
    };
  } catch (error) {
    return {
      tool: "Prettier",
      success: false,
      output: "",
      error: error.message,
    };
  }
}

async function fixTypeScriptIssues(): Promise<LintResult> {
  console.log("Running TypeScript checks and fixes...");

  try {
    // First run tsc to check for type errors
    const tscResult = await runCommand("npx tsc --noEmit");

    // Get all TypeScript files
    const tsFiles = await glob("**/*.{ts,tsx}", {
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.git/**"],
    });

    // Use the fix-code script to fix common TypeScript issues
    const fixResult = await runCommand("npx tsx scripts/fix-code.ts --fix");

    return {
      tool: "TypeScript",
      success: !tscResult.stderr,
      output: tscResult.stdout + "\n" + fixResult.stdout,
      error: tscResult.stderr || fixResult.stderr || undefined,
    };
  } catch (error) {
    return {
      tool: "TypeScript",
      success: false,
      output: "",
      error: error.message,
    };
  }
}

async function lintAndFix() {
  try {
    const projectRoot = process.cwd();
    console.log("Starting comprehensive linting and auto-fixing process...");

    // Create backup
    await createBackup();

    // Run all linting tools
    const results: LintResult[] = [];

    // First run TypeScript fixes
    results.push(await fixTypeScriptIssues());

    // Then run ESLint
    results.push(await runESLint());

    // Then run Biome
    results.push(await runBiome());

    // Finally run Prettier
    results.push(await runPrettier());

    // Print summary
    console.log("\n=== Linting and Auto-Fix Summary ===");
    for (const result of results) {
      console.log(
        `${result.tool}: ${result.success ? "✅ Success" : "❌ Issues found"}`,
      );
      if (result.error) {
        console.log(`  Errors: ${result.error}`);
      }
    }

    const allSuccess = results.every((r) => r.success);
    console.log(
      `\nOverall result: ${allSuccess ? "✅ All checks passed" : "❌ Some issues found"}`,
    );

    if (!allSuccess) {
      console.log(
        "\nSome issues may require manual intervention. Check the error messages above.",
      );
    }
  } catch (error) {
    console.error("Error during linting and auto-fixing:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  lintAndFix().catch(console.error);
}

export { lintAndFix };
