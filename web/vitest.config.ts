// Unit tests of the price formulas, constructor rules, knowledge base and service clients
// (tests/unit; services answer from data/knowledge_base/mock_*.json). The browser flows are
// covered by Playwright (tests/e2e, playwright.config.ts).

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "server-only": path.resolve(__dirname, "tests/unit/support/server-only.ts"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
