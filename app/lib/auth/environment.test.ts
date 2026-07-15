import { describe, expect, it } from "vitest";
import { isTestMode } from "./environment";

describe("auth environment", () => {
  it("enables test mode only when explicitly requested", () => {
    const env = { IS_TEST: "true", NODE_ENV: "test" };

    expect(isTestMode(env)).toBe(true);
    expect(isTestMode({ NODE_ENV: "test" })).toBe(false);
  });

  it("never enables test mode in production", () => {
    const env = { IS_TEST: "true", NODE_ENV: "production" };

    expect(isTestMode(env)).toBe(false);
  });
});
