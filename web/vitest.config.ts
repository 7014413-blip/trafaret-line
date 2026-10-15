// Unit tests of the price formulas, constructor rules and helpers (tests/unit). The browser
// flows are covered by Playwright (tests/e2e, playwright.config.ts).

import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
