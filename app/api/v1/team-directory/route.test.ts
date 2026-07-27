import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/teamDirectory/feed", () => ({
  getTeamDirectoryV1: vi.fn(),
}));
vi.mock("@/lib/server/teamDirectory/token", () => ({
  authenticateTeamDirectoryToken: vi.fn(),
}));

import { getTeamDirectoryV1 } from "@/lib/server/teamDirectory/feed";
import { authenticateTeamDirectoryToken } from "@/lib/server/teamDirectory/token";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

test("GET rejects requests without a valid bearer token", async () => {
  const response = await GET(
    new Request("http://localhost/api/v1/team-directory"),
  );

  expect(response.status).toBe(401);
  expect(getTeamDirectoryV1).not.toHaveBeenCalled();
});

test("GET returns the versioned feed and revision ETag", async () => {
  vi.mocked(authenticateTeamDirectoryToken).mockResolvedValue("org-1");
  vi.mocked(getTeamDirectoryV1).mockResolvedValue({
    version: "v1",
    generatedAt: "2026-07-27T12:00:00.000Z",
    revision: "revision-1",
    data: { board: [], departments: [] },
  });

  const response = await GET(
    new Request("http://localhost/api/v1/team-directory", {
      headers: { Authorization: "Bearer valid-token" },
    }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("etag")).toBe('"revision-1"');
  expect(getTeamDirectoryV1).toHaveBeenCalledWith("org-1");
});

test("GET returns 304 when the feed revision is unchanged", async () => {
  vi.mocked(authenticateTeamDirectoryToken).mockResolvedValue("org-1");
  vi.mocked(getTeamDirectoryV1).mockResolvedValue({
    version: "v1",
    generatedAt: "2026-07-27T12:00:00.000Z",
    revision: "revision-1",
    data: { board: [], departments: [] },
  });

  const response = await GET(
    new Request("http://localhost/api/v1/team-directory", {
      headers: {
        Authorization: "Bearer valid-token",
        "If-None-Match": '"revision-1"',
      },
    }),
  );

  expect(response.status).toBe(304);
  expect(await response.text()).toBe("");
});
