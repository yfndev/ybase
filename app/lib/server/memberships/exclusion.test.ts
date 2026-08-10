import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  deleteWorkspaceUser: vi.fn(),
  suspendWorkspaceUser: vi.fn(),
}));

import { requireRole } from "../../auth/session";
import { membershipEvents, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership, User } from "../../db/types";
import {
  deleteWorkspaceUser,
  suspendWorkspaceUser,
} from "../../googleWorkspace/membershipLifecycle";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { excludeOfficialMember } from "./exclusion";

setupTestDatabase();

let actorId: string;
let memberId: string;
let membershipId: string;
let organizationId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  actorId = newId();
  memberId = newId();
  membershipId = newId();
  organizationId = newId();
  vi.mocked(requireRole).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
  vi.mocked(deleteWorkspaceUser).mockResolvedValue();
  vi.mocked(suspendWorkspaceUser).mockResolvedValue();

  const membership: Membership = {
    _id: membershipId,
    _creationTime: Date.now(),
    organizationId,
    userId: memberId,
    membershipNumber: "YFN-TEST-EXCLUSION",
    isCurrent: true,
    legalStatus: "active",
    admittedAt: Date.now() - 1_000,
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    updatedAt: Date.now(),
  };
  const member: User = {
    _id: memberId,
    _creationTime: Date.now(),
    organizationId,
    membershipId,
    name: "Alex Example",
    email: "alex@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    teamId: newId(),
    secondaryTeamId: newId(),
    isTeamLead: true,
  };
  await (await memberships()).insertOne(membership);
  await (await users()).insertOne(member);
});

test("finalizes the membership and deletes Workspace access", async () => {
  await excludeOfficialMember({ userId: memberId });

  expect(requireRole).toHaveBeenCalledWith("admin");
  expect(suspendWorkspaceUser).toHaveBeenCalledWith("google-user-1");
  expect(deleteWorkspaceUser).toHaveBeenCalledWith("google-user-1");
  expect(
    await (await memberships()).findOne({ _id: membershipId }),
  ).toMatchObject({
    isCurrent: false,
    legalStatus: "ended",
    endReason: "exclusion",
    endedAt: expect.any(Number),
    workspaceSuspensionNotRequiredAt: expect.any(Number),
  });
  const member = await (await users()).findOne({ _id: memberId });
  expect(member).toMatchObject({
    memberStatus: "excluded",
    role: "member",
    excludedAt: expect.any(Number),
    workspaceAccountDeletedAt: expect.any(Number),
  });
  expect(member).not.toHaveProperty("googleWorkspaceUserId");
  expect(member).not.toHaveProperty("teamId");
  expect(member).not.toHaveProperty("secondaryTeamId");
  expect(member).not.toHaveProperty("isTeamLead");
  expect(
    await (await membershipEvents()).distinct("type", { membershipId }),
  ).toEqual(["membership.ended"]);
});

test("rejects profiles without an official membership", async () => {
  await (
    await users()
  ).updateOne({ _id: memberId }, { $unset: { membershipId: "" } });

  await expect(excludeOfficialMember({ userId: memberId })).rejects.toThrow(
    "keine Mitgliedschaft verwaltet",
  );
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("does not allow the last admin to be excluded", async () => {
  await (
    await users()
  ).updateOne({ _id: memberId }, { $set: { role: "admin" } });

  await expect(excludeOfficialMember({ userId: memberId })).rejects.toThrow(
    "letzte Admin",
  );
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("does not allow members from another organization to be excluded", async () => {
  vi.mocked(requireRole).mockResolvedValue(
    createTestActor({ organizationId: newId() }),
  );

  await expect(excludeOfficialMember({ userId: memberId })).rejects.toThrow(
    "Mitglied nicht gefunden",
  );
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("does not allow actors to exclude their own account", async () => {
  vi.mocked(requireRole).mockResolvedValue(
    createTestActor({ _id: memberId, organizationId }),
  );

  await expect(excludeOfficialMember({ userId: memberId })).rejects.toThrow(
    "eigene Account",
  );
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("retries Workspace deletion after the membership already ended", async () => {
  vi.mocked(deleteWorkspaceUser).mockRejectedValueOnce(
    new Error("Google unavailable"),
  );
  await expect(excludeOfficialMember({ userId: memberId })).rejects.toThrow(
    "Google unavailable",
  );

  await expect(
    excludeOfficialMember({ userId: memberId }),
  ).resolves.toBeUndefined();
  expect(deleteWorkspaceUser).toHaveBeenCalledTimes(2);
  expect(await (await users()).findOne({ _id: memberId })).toMatchObject({
    memberStatus: "excluded",
    workspaceAccountDeletedAt: expect.any(Number),
  });
  expect(
    await (
      await membershipEvents()
    ).countDocuments({ membershipId, type: "membership.ended" }),
  ).toBe(1);
});
