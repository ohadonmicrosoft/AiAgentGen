// Simple migration script that runs the db:push command
import { execSync } from "child_process";

try {
  console.log("Running database migration...");
  execSync("npx drizzle-kit push", { stdio: "inherit" });
  console.log("Migration completed successfully!");
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
