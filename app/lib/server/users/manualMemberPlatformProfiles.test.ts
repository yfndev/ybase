import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../applications/memberPlatformCandidates", () => ({
  searchApplicationMemberPlatformCandidates: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { searchApplicationMemberPlatformCandidates } from "../applications/memberPlatformCandidates";
import { searchManualMemberPlatformProfiles } from "./manualMemberPlatformProfiles";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(searchApplicationMemberPlatformCandidates).mockResolvedValue([]);
});

test("searches confirmed profiles only after checking member permissions", async () => {
  await expect(
    searchManualMemberPlatformProfiles({
      name: "  Inês Torres Ferreira  ",
      privateEmail: "  INES@EXAMPLE.COM  ",
    }),
  ).resolves.toEqual([]);

  expect(requirePermission).toHaveBeenCalledWith("manage_members");
  expect(searchApplicationMemberPlatformCandidates).toHaveBeenCalledWith({
    applicantName: "Inês Torres Ferreira",
    privateEmail: "ines@example.com",
  });
});

test("rejects invalid lookup data before querying member profiles", async () => {
  await expect(
    searchManualMemberPlatformProfiles({ name: "I", privateEmail: "invalid" }),
  ).rejects.toThrow();
  expect(searchApplicationMemberPlatformCandidates).not.toHaveBeenCalled();
});
