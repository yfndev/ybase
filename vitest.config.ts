import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts"],
    env: {
      RESEND_API_KEY: "test-api-key",
    },
  },
});
