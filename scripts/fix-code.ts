import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';
import * as jscodeshift from 'jscodeshift';
import type { API, FileInfo, Transform } from 'jscodeshift';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

interface FixOptions {
  fix: boolean;
  paths?: string[];
}

// Transform require statements to ES6 imports
function transformRequireToImport(file: FileInfo, api: API) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Find all require statements
  root
    .find(j.CallExpression, {
      callee: { type: 'Identifier', name: 'require' }
    })
    .forEach(path => {
      const parent = path.parentPath.node;
      
      if (parent.type === 'VariableDeclarator') {
        const importPath = path.node.arguments[0].value;
        const importName = parent.id.name;
        
        // Create import declaration
        const importDeclaration = j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier(importName))],
          j.literal(importPath)
        );
        
        // Find the variable declaration
        const varDecl = path.parentPath.parentPath;
        
        // Replace require with import
        j(varDecl).replaceWith(importDeclaration);
      }
    });

  return root.toSource();
}

// Fix TypeScript syntax issues
function fixTypescriptSyntax(content: string): string {
  // Remove incorrect index signatures
  content = content.replace(/\[\s*key:\s*string\s*\]:\s*any;\s*/g, '');
  
  // Fix object type annotations
  content = content.replace(/{\s*\[key:\s*string\]:\s*any\s*}/g, 'Record<string, any>');
  
  // Add type parameters to reduce calls
  content = content.replace(
    /\.reduce\((.*?)\)/g, 
    '.reduce<Record<string, any>>($1)'
  );

  // Fix empty interfaces
  content = content.replace(
    /interface\s+(\w+)\s+extends\s+(\w+)\s*\{\s*\}/g,
    'type $1 = $2'
  );

  return content;
}

// Process a single file
async function processFile(filePath: string, fix: boolean = false): Promise<void> {
  try {
    console.log(`Processing ${filePath}...`);
    const source = readFileSync(filePath, 'utf-8');
    
    // Create a mock FileInfo object
    const fileInfo = {
      path: filePath,
      source: source
    };

    // Create a mock API object with jscodeshift
    const api = {
      j: jscodeshift,
      jscodeshift: jscodeshift,
      stats: () => {},
      report: () => {}
    };

    // Transform the code
    let transformedCode = transformRequireToImport(fileInfo, api);

    if (fix) {
      // Format the code
      try {
        transformedCode = await format(transformedCode, {
          parser: 'typescript',
          semi: true,
          singleQuote: true,
          trailingComma: 'es5',
          tabWidth: 2
        });
      } catch (err) {
        console.warn(`Warning: Failed to format ${filePath}: ${err.message}`);
      }

      // Write the transformed code back to the file
      writeFileSync(filePath, transformedCode);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
}

// Process a directory recursively
async function processDirectory(dirPath: string, options: FixOptions): Promise<void> {
  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);

      // Skip node_modules and dist directories
      if (entry === 'node_modules' || entry === 'dist') {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        await processDirectory(fullPath, options);
      } else if (
        stat.isFile() &&
        (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))
      ) {
        await processFile(fullPath, options.fix);
      }
    }
  } catch (err) {
    console.error(`Error processing directory ${dirPath}: ${err.message}`);
  }
}

// Main function
async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options: FixOptions = {
      fix: args.includes('--fix'),
      paths: args.filter(arg => !arg.startsWith('--'))
    };

    if (options.paths && options.paths.length > 0) {
      for (const path of options.paths) {
        const fullPath = join(ROOT_DIR, path);
        
        if (existsSync(fullPath)) {
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            await processDirectory(fullPath, options);
          } else if (stat.isFile()) {
            await processFile(fullPath, options.fix);
          }
        } else {
          console.warn(`Warning: Path not found: ${path}`);
        }
      }
    } else {
      await processDirectory(ROOT_DIR, options);
    }

    console.log('Code fixes completed successfully!');
  } catch (error) {
    console.error('Error fixing code:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});