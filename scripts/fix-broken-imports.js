import fs from "fs";
import { glob } from "glob";

// Find all files with syntax errors
const FILES_TO_CHECK = [
  "client/src/components/AgentCard.tsx",
  "client/src/components/theme-toggle.tsx",
  "client/src/components/ui/toaster.tsx",
  "client/src/components/wizard/AgentBasicInfo.tsx",
  "client/src/components/wizard/AgentConfiguration.tsx",
  "client/src/main.tsx",
  "client/src/pages/palette-demo.tsx",
  "client/src/pages/typography-demo.tsx",
];

async function fixBrokenImports() {
  console.log("Fixing broken import statements...");

  let fixedCount = 0;

  for (const file of FILES_TO_CHECK) {
    try {
      const content = fs.readFileSync(file, "utf8");

      // Check if file has broken import
      if (content.includes("import {\nimport React from")) {
        // Fix the broken import by removing the React import line
        const fixedContent = content.replace(
          /import \{\nimport React from "react";\n/,
          "import {\n",
        );

        // Add React import at the top
        const finalContent = 'import React from "react";\n' + fixedContent;

        fs.writeFileSync(file, finalContent, "utf8");
        fixedCount++;
        console.log(`Fixed broken import in ${file}`);
      }
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`Fixed broken imports in ${fixedCount} files`);
}

fixBrokenImports().catch(console.error);
