// Every environment variable the code reads is listed in its example file, so a new server
// can be set up from web/.env.example, backend/.env.template and bot/.env.example alone.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import fop from "@/data/knowledge_base/rules_fop.json";
import type { EnvScope } from "@/types/system";

const REPO = path.resolve(__dirname, "..", "..", "..");
const SOURCE = /\.(ts|tsx|mjs)$/;
/** Set by Node and the tools themselves, not by the people running the site. */
const RUNTIME = new Set(["NODE_ENV"]);

const APPS: Record<EnvScope, { roots: string[]; example: string; skip: string[] }> = {
  web: { roots: ["web/app", "web/lib", "web/services", "web/data", "web/store", "web/components"], example: "web/.env.example", skip: [] },
  backend: { roots: ["backend/src", "backend/medusa-config.ts"], example: "backend/.env.template", skip: ["backend/src/shared"] },
  bot: { roots: ["bot/src"], example: "bot/.env.example", skip: [] },
};

const PATTERNS = [
  /process\.env\.([A-Z][A-Z0-9_]+)/g,
  /process\.env\[\s*"([A-Z][A-Z0-9_]+)"\s*\]/g,
  /\benv\.([A-Z][A-Z0-9_]+)/g,
  /(?:envOr|envNumber|required)\(\s*(?:env,\s*)?"([A-Z][A-Z0-9_]+)"/g,
];
const DESTRUCTURED = /const\s*\{([^}]+)\}\s*=\s*process\.env/g;
const REQUIRE_LIST = /requireEnv\(\s*"[\w-]+",\s*\[([^\]]+)\]/g;

function sourceFiles(entry: string, skip: string[]): string[] {
  const full = path.join(REPO, entry);
  if (skip.some((s) => entry.startsWith(s)) || !fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return SOURCE.test(full) ? [full] : [];
  return fs.readdirSync(full).flatMap((name) => (name === "node_modules" ? [] : sourceFiles(path.join(entry, name), skip)));
}

function variablesUsed(app: EnvScope): Set<string> {
  const found = new Set<string>();
  for (const file of APPS[app].roots.flatMap((root) => sourceFiles(root, APPS[app].skip))) {
    const text = fs.readFileSync(file, "utf8");
    for (const pattern of PATTERNS) for (const m of text.matchAll(pattern)) found.add(m[1]);
    for (const m of text.matchAll(DESTRUCTURED)) for (const name of m[1].split(",")) found.add(name.trim().split(/\s|:/)[0]);
    for (const m of text.matchAll(REQUIRE_LIST)) for (const name of m[1].matchAll(/"([A-Z][A-Z0-9_]+)"/g)) found.add(name[1]);
  }
  if (app === "web") for (const name of fop.seller.requisitesEnv) found.add(name);
  for (const name of RUNTIME) found.delete(name);
  return found;
}

function variablesListed(app: EnvScope): Set<string> {
  const text = fs.readFileSync(path.join(REPO, APPS[app].example), "utf8");
  return new Set([...text.matchAll(/^#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]));
}

describe("environment examples", () => {
  for (const app of Object.keys(APPS) as EnvScope[]) {
    it(`${APPS[app].example} lists every variable ${app} reads`, () => {
      const used = variablesUsed(app);
      expect(used.size).toBeGreaterThan(3);
      const listed = variablesListed(app);
      expect([...used].filter((name) => !listed.has(name)).sort()).toEqual([]);
    });
  }

  it("keeps real keys out of the examples", () => {
    for (const { example } of Object.values(APPS)) {
      const text = fs.readFileSync(path.join(REPO, example), "utf8");
      const values = [...text.matchAll(/^([A-Z][A-Z0-9_]*(?:KEY|TOKEN|SECRET|IBAN|CODE))=(.+)$/gm)].map((m) => `${m[1]}=${m[2].trim()}`);
      expect(values.filter((v) => !/=(supersecret)?$/.test(v))).toEqual([]);
    }
  });
});
