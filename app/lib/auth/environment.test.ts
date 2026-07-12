import { describe, expect, it } from "vitest";
import {
  isDevelopmentLoginEnabled,
  isLocalCredentialsEnabled,
  isTestMode,
} from "./environment";

describe("auth environment", () => {
  it("enables the development login only when explicitly requested", () => {
    expect(
      isDevelopmentLoginEnabled({
        AUTH_DEV_LOGIN: "true",
        NODE_ENV: "development",
      }),
    ).toBe(true);
    expect(isDevelopmentLoginEnabled({ NODE_ENV: "development" })).toBe(false);
  });

  it("keeps test mode independent from the development login", () => {
    const env = { IS_TEST: "true", NODE_ENV: "test" };

    expect(isTestMode(env)).toBe(true);
    expect(isDevelopmentLoginEnabled(env)).toBe(false);
    expect(isLocalCredentialsEnabled(env)).toBe(true);
  });

  it("never enables local credentials in production", () => {
    const env = {
      AUTH_DEV_LOGIN: "true",
      IS_TEST: "true",
      NODE_ENV: "production",
    };

    expect(isDevelopmentLoginEnabled(env)).toBe(false);
    expect(isTestMode(env)).toBe(false);
    expect(isLocalCredentialsEnabled(env)).toBe(false);
  });
});
