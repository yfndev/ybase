import { afterEach, expect, test, vi } from "vitest";
import { authenticateTeamDirectoryToken } from "./auth";

const token = "a".repeat(32);

afterEach(() => {
  vi.unstubAllEnvs();
});

test("returns the configured organization for the shared token", () => {
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_TOKEN", token);
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID", "org-1");

  expect(authenticateTeamDirectoryToken(token)).toBe("org-1");
});

test("rejects missing, weak, and mismatched configuration", () => {
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_TOKEN", "");
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID", "");
  expect(authenticateTeamDirectoryToken(token)).toBeNull();

  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_TOKEN", "too-short");
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID", "org-1");
  expect(authenticateTeamDirectoryToken("too-short")).toBeNull();

  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_TOKEN", token);
  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID", "");
  expect(authenticateTeamDirectoryToken(token)).toBeNull();

  vi.stubEnv("YFN_LANDING_TEAM_DIRECTORY_ORGANIZATION_ID", "org-1");
  expect(authenticateTeamDirectoryToken("b".repeat(32))).toBeNull();
});
