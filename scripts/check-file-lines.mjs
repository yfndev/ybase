import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_LINES = 200;
const ROOT = "app";
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const isExcluded = (path) =>
  path.startsWith("app/components/ui/") ||
  path.endsWith(".d.ts") ||
  /\.(test|spec)\.[jt]sx?$/.test(path);

const isSource = (path) =>
  SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension));

function collectFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectFiles(path));
      continue;
    }
    if (isSource(path) && !isExcluded(path)) files.push(path);
  }
  return files;
}

const violations = collectFiles(ROOT)
  .map((path) => ({
    path,
    lines: readFileSync(path, "utf8").split("\n").length,
  }))
  .filter((file) => file.lines > MAX_LINES)
  .sort((first, second) => second.lines - first.lines);

if (violations.length === 0) {
  console.log(`All source files are within ${MAX_LINES} lines.`);
  process.exit(0);
}

console.error(`Files exceeding ${MAX_LINES} lines:`);
for (const file of violations) console.error(`  ${file.lines}\t${file.path}`);
process.exit(1);
