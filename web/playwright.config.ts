// End-to-end tests of the main buying paths (tests/e2e). The storefront runs as a production
// build against a mock Medusa (tests/e2e/mock-medusa/server.mjs), so no real keys, shop or
// payment are touched. The same mock answers as the Nova Poshta API (NP_API_URL) with
// data/knowledge_base/mock_novaposhta.json; the WayForPay page is mocked in the tests.
//
// Build once with the mock address (the mock must be running, the home page reads the
// catalogue while it is built), then run:
//   node tests/e2e/mock-medusa/server.mjs &
//   NEXT_PUBLIC_MEDUSA_URL=http://127.0.0.1:9100 NEXT_PUBLIC_MEDUSA_PK=pk_e2e npm run build
//   npm run test:e2e

import { defineConfig, devices } from "@playwright/test";

const MOCK_PORT = 9100;
const SITE_PORT = 3100;
/**
 * The same backend address at build and at start (next.config.ts reads it for product photos);
 * Nova Poshta goes to the mock too, with a test key, so the site's own /api/novaposhta routes run.
 */
const SITE_ENV = {
  NEXT_PUBLIC_MEDUSA_URL: `http://127.0.0.1:${MOCK_PORT}`,
  NEXT_PUBLIC_MEDUSA_PK: "pk_e2e",
  NP_API_KEY: "e2e",
  NP_API_URL: `http://127.0.0.1:${MOCK_PORT}/novaposhta/`,
  NP_SENDER_CITY_REF: "e2e-sender-boryspil",
  // Cabinet: both sign-in buttons, and the secret the mock signs its sessions with (account.mjs).
  GOOGLE_CLIENT_ID: "e2e-client.apps.googleusercontent.com",
  TELEGRAM_BOT_ID: "123456789",
  INTERNAL_API_TOKEN: "e2e-internal-token",
};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${SITE_PORT}`,
    locale: "uk-UA",
    timezoneId: "Europe/Kyiv",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "node tests/e2e/mock-medusa/server.mjs",
      url: `http://127.0.0.1:${MOCK_PORT}/health`,
      env: { MOCK_MEDUSA_PORT: String(MOCK_PORT) },
      reuseExistingServer: true,
    },
    {
      command: `npx next start -p ${SITE_PORT} -H 127.0.0.1`,
      url: `http://127.0.0.1:${SITE_PORT}`,
      env: SITE_ENV,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
