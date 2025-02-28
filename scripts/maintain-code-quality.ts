import { exec } from "child_process";
import path from "path";
import { promisify } from "util";
import fs from "fs/promises";

const execAsync = promisify(exec);

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

async function runCommand(command: string, description: string): Promise<void> {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✅ ${description} completed`);
  } catch (error: any) {
    console.error(`❌ ${description} failed:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
  }
}

async function checkDependencies() {
  await runCommand(
    "npx npm-check-updates",
    "Checking for outdated dependencies",
  );
  await runCommand("npm audit", "Checking for security vulnerabilities");
  await runCommand("npx depcheck", "Checking for unused dependencies");
}

async function lintAndFormat() {
  await runCommand("npm run lint:fix", "Running ESLint with auto-fix");
  await runCommand("npx prettier --write .", "Formatting code with Prettier");
  await runCommand(
    "npx @biomejs/biome check --apply .",
    "Running Biome checks with auto-fix",
  );
}

async function typeCheck() {
  await runCommand("npm run check", "Running TypeScript type checking");
}

async function runTests() {
  await runCommand("npm test", "Running unit tests");
}

async function analyzeBundle() {
  await runCommand("npm run analyze", "Analyzing bundle size");
}

async function securityCheck() {
  await runCommand("npx snyk test", "Running security checks with Snyk");
}

async function performanceCheck() {
  console.log(
    "\n⚠️ To run Lighthouse, make sure your app is running on http://localhost:3000",
  );
  console.log("⚠️ Run the following command in a separate terminal:");
  console.log("npx lighthouse http://localhost:3000 --view");
}

async function updateScripts() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));

  // Add or update scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "update:deps": "npx npm-check-updates -u && npm install",
    "security:check": "npm audit && npx snyk test",
    format: "prettier --write .",
    "fix:all":
      "npm run lint:fix && npm run format && npx @biomejs/biome check --apply .",
    maintain: "tsx scripts/maintain-code-quality.ts",
  };

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log("✅ Updated package.json scripts");
}

async function maintainCodeQuality() {
  console.log("🚀 Starting code quality maintenance...");

  // Create backup
  await createBackup();

  // Update package.json scripts
  await updateScripts();

  // Run all maintenance tasks
  await checkDependencies();
  await lintAndFormat();
  await typeCheck();
  await runTests();
  await analyzeBundle();
  await securityCheck();

  // Provide instructions for performance check
  await performanceCheck();

  console.log("\n✨ Code quality maintenance completed!");
  console.log("\n📋 Summary of available commands:");
  console.log("- npm run update:deps - Update dependencies");
  console.log("- npm run security:check - Check for security vulnerabilities");
  console.log("- npm run format - Format code with Prettier");
  console.log("- npm run fix:all - Run all linters and formatters");
  console.log("- npm run maintain - Run this maintenance script");
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  maintainCodeQuality().catch(console.error);
}

export { maintainCodeQuality };
