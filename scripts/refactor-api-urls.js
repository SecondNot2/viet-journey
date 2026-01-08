/**
 * Script to refactor hardcoded localhost URLs to use centralized API config
 * Run with: node scripts/refactor-api-urls.js
 */

const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "../src");

// Patterns to replace
const replacements = [
  // Pattern 1: const API_URL = process.env... || "http://localhost:5000";
  {
    pattern:
      /const API_URL = process\.env\.REACT_APP_API_URL \|\| ["']http:\/\/localhost:5000["'];/g,
    replacement: (filePath) => {
      const relativePath = getRelativePath(filePath, "src/api");
      return `import { API_BASE_URL as API_URL } from "${relativePath}";`;
    },
    isImport: true,
  },
  // Pattern 2: const API_BASE_URL = "http://localhost:5000";
  {
    pattern: /const API_BASE_URL = ["']http:\/\/localhost:5000["'];/g,
    replacement: (filePath) => {
      const relativePath = getRelativePath(filePath, "src/api");
      return `import { API_HOST as API_BASE_URL } from "${relativePath}";`;
    },
    isImport: true,
  },
  // Pattern 3: process.env.REACT_APP_API_URL || "http://localhost:5000"
  {
    pattern:
      /process\.env\.REACT_APP_API_URL \|\| ["']http:\/\/localhost:5000["']/g,
    replacement: () => "API_URL",
    isImport: false,
  },
  // Pattern 4: Direct hardcoded URLs in axios calls
  {
    pattern: /["']http:\/\/localhost:5000\/api\//g,
    replacement: () => "`${API_URL}/",
    isImport: false,
  },
  // Pattern 5: Direct hardcoded URLs ending with quote
  {
    pattern: /http:\/\/localhost:5000\/api([^"']*)(["'])/g,
    replacement: () => "${API_URL}$1`",
    isImport: false,
  },
];

function getRelativePath(fromFile, toDir) {
  const fromDir = path.dirname(fromFile);
  const toPath = path.join(srcDir, "api");
  let relative = path.relative(fromDir, toPath).replace(/\\/g, "/");
  if (!relative.startsWith(".")) {
    relative = "./" + relative;
  }
  return relative;
}

function processFile(filePath) {
  if (!filePath.endsWith(".js") || filePath.includes("node_modules")) {
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  let needsImport = false;

  // Check if file contains any hardcoded URLs
  if (!content.includes("localhost:5000")) {
    return;
  }

  console.log(`Processing: ${filePath}`);

  // Check if already has API import
  const hasApiImport =
    content.includes("from") &&
    (content.includes('/api"') || content.includes("/api'"));

  // Apply replacements
  for (const rep of replacements) {
    if (rep.pattern.test(content)) {
      const replacement =
        typeof rep.replacement === "function"
          ? rep.replacement(filePath)
          : rep.replacement;

      content = content.replace(rep.pattern, replacement);
      modified = true;

      if (rep.isImport) {
        needsImport = false; // Import already added by replacement
      } else {
        needsImport = true;
      }
    }
  }

  // Add import if needed and not already present
  if (
    needsImport &&
    !hasApiImport &&
    !content.includes("API_BASE_URL as API_URL")
  ) {
    const relativePath = getRelativePath(filePath, "src/api");
    const importStatement = `import { API_BASE_URL as API_URL, API_HOST } from "${relativePath}";\n`;

    // Find the last import statement and add after it
    const lastImportIndex = content.lastIndexOf("import ");
    if (lastImportIndex !== -1) {
      const lineEnd = content.indexOf("\n", lastImportIndex);
      content =
        content.slice(0, lineEnd + 1) +
        importStatement +
        content.slice(lineEnd + 1);
    } else {
      content = importStatement + content;
    }
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`  ✅ Updated: ${path.relative(srcDir, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  }
}

console.log("🔄 Starting API URL refactoring...\n");
walkDir(srcDir);
console.log("\n✅ Refactoring complete!");
console.log(
  "\n⚠️  Please review the changes and test locally before committing."
);
