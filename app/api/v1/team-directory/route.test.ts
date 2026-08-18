import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/teamDirectory/feed", () => ({
  getTeamDirectory: vi.fn(),
}));

import { getTeamDirectory } from "@/lib/server/teamDirectory/feed";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("YFN_TEAM_DIRECTORY_ORGANIZATION_ID", "org-1");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ybase.example/");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("GET reports missing organization configuration", async () => {
  vi.stubEnv("YFN_TEAM_DIRECTORY_ORGANIZATION_ID", "");
  const response = await GET(
    new Request("http://localhost/api/v1/team-directory"),
  );

  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(getTeamDirectory).not.toHaveBeenCalled();
});

test("GET returns the versioned feed and revision ETag", async () => {
  vi.mocked(getTeamDirectory).mockResolvedValue({
    version: "v1",
    generatedAt: "2026-07-27T12:00:00.000Z",
    revision: "revision-1",
    data: { board: [], departments: [] },
  });

  const response = await GET(
    new Request("http://localhost/api/v1/team-directory"),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("etag")).toBe('"revision-1"');
  expect(response.headers.get("cache-control")).toContain("public");
  expect(getTeamDirectory).toHaveBeenCalledWith(
    "org-1",
    "https://ybase.example",
  );
});

test("GET returns 304 when the feed revision is unchanged", async () => {
  vi.mocked(getTeamDirectory).mockResolvedValue({
    version: "v1",
    generatedAt: "2026-07-27T12:00:00.000Z",
    revision: "revision-1",
    data: { board: [], departments: [] },
  });

  const response = await GET(
    new Request("http://localhost/api/v1/team-directory", {
      headers: { "If-None-Match": '"revision-1"' },
    }),
  );

  expect(response.status).toBe(304);
  expect(await response.text()).toBe("");
});
