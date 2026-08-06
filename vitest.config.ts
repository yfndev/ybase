import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
    globalSetup: ["app/lib/test/globalSetup.ts"],
    maxWorkers: process.env.CI ? 2 : undefined,
  },
});
