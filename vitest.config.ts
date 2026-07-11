import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./vitest.globalSetup.ts",
    include: ["app/**/*.test.ts"],
    fileParallelism: !process.env.CI,
    env: {
      RESEND_API_KEY: "test-api-key",
    },
  },
});
