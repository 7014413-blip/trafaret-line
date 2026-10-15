// Builds backend/src/shared from the storefront sources, so the price formulas, constructor
// rules and their types live in one place: web/lib and web/types.
//
// The backend imports shared code as "../shared/lib/…" and "../shared/types/…". This script
// finds every such import in backend/src and backend/integration-tests, copies the matching web
// file and everything it imports (relative imports only, followed recursively), and adds a header
// that names the source file. backend/src/shared is generated and ignored by git: edit the file
// in web/, then run `npm run sync-shared` (it also runs on install, build, dev and tests).
//
// The knowledge base (web/data/knowledge_base/*.json: material rates, packaging, seller) is
// shared the same way when a shared file imports it.
//
// The script stops with an error when a shared web file imports something the backend cannot
// resolve: an "@/…" alias or a package that is not a backend dependency.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB_DIR = path.resolve(BACKEND_DIR, "..", "web");
const SHARED_DIR = path.join(BACKEND_DIR, "src", "shared");
const SCAN_DIRS = [path.join(BACKEND_DIR, "src"), path.join(BACKEND_DIR, "integration-tests")];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const SHARED_ROOTS = ["lib", "types", "data/knowledge_base"];
const DATA_EXTENSION = ".json";
const NODE_BUILTIN = /^node:/;

const SPECIFIER = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const SHARED_SPECIFIER = /(?:^|\/)shared\/((?:lib|types)\/.+)$/;

function header(relFromWeb) {
  return `// GENERATED from web/${relFromWeb} by backend/scripts/sync-shared.mjs. Do not edit here: edit the web file.\n`;
}

function listSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full === SHARED_DIR || entry.name === "node_modules") continue;
      out.push(...listSourceFiles(full));
    } else if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function specifiersOf(source) {
  const found = [];
  for (const match of source.matchAll(SPECIFIER)) found.push(match[1] ?? match[2]);
  return found;
}

function resolveWebFile(withoutExtension) {
  if (withoutExtension.endsWith(DATA_EXTENSION)) return fs.existsSync(withoutExtension) ? withoutExtension : null;
  const candidates = [
    ...SOURCE_EXTENSIONS.map((ext) => withoutExtension + ext),
    ...SOURCE_EXTENSIONS.map((ext) => path.join(withoutExtension, "index" + ext)),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function packageName(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function backendDependencies() {
  const pkg = JSON.parse(fs.readFileSync(path.join(BACKEND_DIR, "package.json"), "utf8"));
  return new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
}

function entryFiles() {
  const entries = new Map();
  for (const file of SCAN_DIRS.flatMap(listSourceFiles)) {
    for (const specifier of specifiersOf(fs.readFileSync(file, "utf8"))) {
      const match = SHARED_SPECIFIER.exec(specifier);
      if (!match || !specifier.startsWith(".")) continue;
      const webFile = resolveWebFile(path.join(WEB_DIR, match[1]));
      if (!webFile) {
        throw new Error(`${path.relative(BACKEND_DIR, file)} imports "${specifier}", but web/${match[1]} does not exist`);
      }
      entries.set(webFile, path.relative(BACKEND_DIR, file));
    }
  }
  return entries;
}

function collectClosure(entries, dependencies) {
  const queue = [...entries.keys()];
  const seen = new Set();
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const relFromWeb = path.relative(WEB_DIR, file);
    const relPosix = relFromWeb.split(path.sep).join("/");
    if (!SHARED_ROOTS.some((root) => relPosix.startsWith(`${root}/`))) {
      throw new Error(`web/${relPosix} is outside ${SHARED_ROOTS.map((r) => `web/${r}`).join(", ")} and cannot be shared`);
    }
    if (file.endsWith(DATA_EXTENSION)) continue;
    for (const specifier of specifiersOf(fs.readFileSync(file, "utf8"))) {
      if (specifier.startsWith(".")) {
        const target = resolveWebFile(path.resolve(path.dirname(file), specifier));
        if (!target) throw new Error(`web/${relFromWeb} imports "${specifier}", which does not exist`);
        queue.push(target);
      } else if (specifier.startsWith("@/")) {
        throw new Error(`web/${relFromWeb} imports "${specifier}": shared files must use relative imports`);
      } else if (!NODE_BUILTIN.test(specifier) && !dependencies.has(packageName(specifier))) {
        throw new Error(`web/${relFromWeb} imports "${specifier}", which is not a backend dependency`);
      }
    }
  }
  return [...seen].sort();
}

function writeShared(files) {
  fs.rmSync(SHARED_DIR, { recursive: true, force: true });
  for (const file of files) {
    const relFromWeb = path.relative(WEB_DIR, file);
    const target = path.join(SHARED_DIR, relFromWeb);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const source = fs.readFileSync(file, "utf8");
    // JSON has no comments: data files are copied as they are.
    fs.writeFileSync(target, file.endsWith(DATA_EXTENSION) ? source : header(relFromWeb.split(path.sep).join("/")) + source);
  }
}

function main() {
  if (!fs.existsSync(WEB_DIR)) {
    throw new Error(`web sources not found at ${WEB_DIR}: the backend needs the whole repository`);
  }
  const files = collectClosure(entryFiles(), backendDependencies());
  writeShared(files);
  console.log(`sync-shared: ${files.length} files from web/ into backend/src/shared`);
}

try {
  main();
} catch (error) {
  console.error(`sync-shared: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
