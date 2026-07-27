import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({
  requirePermission: vi.fn(),
}));
import { requirePermission } from "../../auth/session";
import { teamDirectoryTokens } from "../../db/collections";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  authenticateTeamDirectoryToken,
  hashTeamDirectoryToken,
  rotateTeamDirectoryToken,
} from "./token";

const token = `ybase_team_${"a".repeat(43)}`;

setupTestDatabase();

beforeEach(async () => {
  vi.clearAllMocks();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({
      _id: "admin-1",
      organizationId: "org-1",
      role: "admin",
    }),
  );
  await (
    await teamDirectoryTokens()
  ).insertOne({
    _id: "team-directory-token",
    _creationTime: 1,
    organizationId: "org-1",
    tokenHash: hashTeamDirectoryToken(token),
    rotatedAt: 1,
    rotatedBy: "admin-1",
  });
});

test("authenticates a valid team directory token", async () => {
  await expect(authenticateTeamDirectoryToken(token)).resolves.toBe("org-1");
});

test("rejects malformed and unknown team directory tokens", async () => {
  await expect(authenticateTeamDirectoryToken("invalid")).resolves.toBeNull();
  await expect(
    authenticateTeamDirectoryToken(`ybase_team_${"b".repeat(43)}`),
  ).resolves.toBeNull();
});

test("rotation invalidates the old token and never stores plaintext", async () => {
  const rotated = await rotateTeamDirectoryToken();

  expect(rotated.token).toMatch(/^ybase_team_[A-Za-z0-9_-]{43}$/);
  await expect(authenticateTeamDirectoryToken(token)).resolves.toBeNull();
  await expect(authenticateTeamDirectoryToken(rotated.token)).resolves.toBe(
    "org-1",
  );

  const stored = await (
    await teamDirectoryTokens()
  ).findOne({ organizationId: "org-1" });
  expect(stored?.tokenHash).toBe(hashTeamDirectoryToken(rotated.token));
  expect(JSON.stringify(stored)).not.toContain(rotated.token);
});
