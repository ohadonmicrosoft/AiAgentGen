import path from "path";
import fs from "fs/promises";
import { glob } from "glob";

// Directories to exclude from the mapping
const EXCLUDE_DIRS = [
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  "tmp",
  "temp",
  ".cache",
];

// File extensions to include in the mapping
const INCLUDE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
];

interface FileInfo {
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileInfo[];
}

async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function mapDirectory(
  dirPath: string,
  relativePath = "",
  depth = 0,
  maxDepth = 5,
): Promise<FileInfo[]> {
  if (depth > maxDepth) {
    return [];
  }

  const entries = await fs.readdir(dirPath);
  const result: FileInfo[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const entryRelativePath = path.join(relativePath, entry);

    // Skip excluded directories
    if (EXCLUDE_DIRS.includes(entry)) {
      continue;
    }

    try {
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        const children = await mapDirectory(
          fullPath,
          entryRelativePath,
          depth + 1,
          maxDepth,
        );

        result.push({
          path: entryRelativePath,
          type: "directory",
          children,
        });
      } else if (stats.isFile()) {
        // Only include files with specified extensions
        const ext = path.extname(entry);
        if (INCLUDE_EXTENSIONS.includes(ext)) {
          result.push({
            path: entryRelativePath,
            type: "file",
            size: stats.size,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${fullPath}:`, error);
    }
  }

  // Sort directories first, then files
  return result.sort((a, b) => {
    if (a.type === "directory" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "directory") return 1;
    return a.path.localeCompare(b.path);
  });
}

function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function printStructure(structure: FileInfo[], indent = ""): void {
  for (const item of structure) {
    if (item.type === "directory") {
      console.log(`${indent}📁 ${item.path}`);
      if (item.children && item.children.length > 0) {
        printStructure(item.children, `${indent}  `);
      }
    } else {
      const sizeStr = item.size ? ` (${formatSize(item.size)})` : "";
      console.log(`${indent}📄 ${item.path}${sizeStr}`);
    }
  }
}

async function generateMarkdownStructure(
  structure: FileInfo[],
  indent = "",
): Promise<string> {
  let markdown = "";

  for (const item of structure) {
    if (item.type === "directory") {
      markdown += `${indent}- 📁 **${path.basename(item.path)}/**\n`;
      if (item.children && item.children.length > 0) {
        markdown += await generateMarkdownStructure(
          item.children,
          `${indent}  `,
        );
      }
    } else {
      const sizeStr = item.size ? ` (${formatSize(item.size)})` : "";
      markdown += `${indent}- 📄 ${path.basename(item.path)}${sizeStr}\n`;
    }
  }

  return markdown;
}

async function mapProject() {
  try {
    const projectRoot = process.cwd();
    console.log(`Mapping project structure for: ${projectRoot}`);

    const structure = await mapDirectory(projectRoot);

    // Print to console
    console.log("\nProject Structure:");
    printStructure(structure);

    // Generate markdown
    const markdown = `# Project Structure\n\n${await generateMarkdownStructure(structure)}`;

    // Write to file
    const outputPath = path.join(projectRoot, "project-structure.md");
    await fs.writeFile(outputPath, markdown);

    console.log(`\nProject structure map saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error mapping project:", error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mapProject().catch(console.error);
}

export { mapProject };
