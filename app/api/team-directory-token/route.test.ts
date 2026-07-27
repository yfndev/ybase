import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/lib/server/teamDirectory/token", () => ({
  rotateTeamDirectoryToken: vi.fn(),
}));

import { rotateTeamDirectoryToken } from "@/lib/server/teamDirectory/token";
import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

test("POST returns a newly rotated team directory token", async () => {
  vi.mocked(rotateTeamDirectoryToken).mockResolvedValue({
    token: `ybase_team_${"a".repeat(43)}`,
    rotatedAt: 123,
  });

  const response = await POST();

  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({
    data: {
      token: `ybase_team_${"a".repeat(43)}`,
      rotatedAt: 123,
    },
  });
});

test("POST does not expose authorization errors", async () => {
  vi.mocked(rotateTeamDirectoryToken).mockRejectedValue(
    new Error("database details"),
  );

  const response = await POST();

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toEqual({
    error: "Nicht autorisiert",
  });
});
