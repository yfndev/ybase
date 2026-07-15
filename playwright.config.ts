import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, ".env.local") });
}

const port = process.env.CI
  ? 3000
  : Number(process.env.CONDUCTOR_PORT ?? 2999) + 1;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests sequentially to avoid shared test data conflicts */
  fullyParallel: false,
  workers: 1,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `pnpm dev --port ${port}`,
    env: {
      ...process.env,
      AUTH_SECRET: "ybase-playwright-test-secret",
      IS_TEST: "true",
      NEXT_DIST_DIR: ".next-playwright",
      TALLY_API_URL: `${baseURL}/api/test/tally`,
      TALLY_MASTER_KEY: "playwright-tally-key",
      TALLY_TEMPLATE_FORM_ID: "playwright-template",
      TALLY_WEBHOOK_SIGNING_SECRET: "playwright-webhook-secret",
      TALLY_WEBHOOK_URL: `${baseURL}/api/webhooks/tally`,
      TALLY_WORKSPACE_ID: "playwright-workspace",
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: process.env.CI ? 30_000 : 120_000,
  },
});
