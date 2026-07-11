import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, ".env.local") });
}

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
    baseURL: process.env.SITE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 30_000 : 120_000,
  },
});
