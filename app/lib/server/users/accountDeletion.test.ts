import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  deleteWorkspaceUser: vi.fn(),
}));

import { requireRole } from "../../auth/session";
import { logs, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { deleteWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { deleteMemberWorkspaceAccount } from "./accountDeletion";

const organizationId = newId();
const otherOrganizationId = newId();
const actorId = newId();

setupTestDatabase();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
  vi.mocked(deleteWorkspaceUser).mockResolvedValue(undefined);
});

test("deletes the Workspace account and preserves the member profile", async () => {
  const memberId = await insertMember({
    googleWorkspaceUserId: "google-user-1",
  });

  await deleteMemberWorkspaceAccount({ userId: memberId });

  expect(deleteWorkspaceUser).toHaveBeenCalledWith("google-user-1");
  const member = await (await users()).findOne({ _id: memberId });
  expect(member).toMatchObject({
    _id: memberId,
    email: "member@youngfounders.network",
    workspaceAccountDeletedAt: expect.any(Number),
  });
  expect(member?.googleWorkspaceUserId).toBeUndefined();
  expect(
    await (
      await logs()
    ).findOne({
      action: "member.workspace_account_deleted",
    }),
  ).toMatchObject({ userId: actorId, entityId: memberId, organizationId });
});

test("cannot delete an account from another organization", async () => {
  const memberId = await insertMember({ organizationId: otherOrganizationId });

  await expect(
    deleteMemberWorkspaceAccount({ userId: memberId }),
  ).rejects.toThrow("Mitglied nicht gefunden");
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("requires an admin account to be demoted before deletion", async () => {
  const memberId = await insertMember({ role: "admin" });

  await expect(
    deleteMemberWorkspaceAccount({ userId: memberId }),
  ).rejects.toThrow("Admin-Accounts können nicht gelöscht werden");
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

test("accepts an idempotent retry after the account was deleted", async () => {
  const memberId = await insertMember({
    workspaceAccountDeletedAt: Date.now(),
  });

  await expect(
    deleteMemberWorkspaceAccount({ userId: memberId }),
  ).resolves.toBeUndefined();
  expect(deleteWorkspaceUser).not.toHaveBeenCalled();
});

async function insertMember(overrides: Partial<User> = {}): Promise<string> {
  const memberId = newId();
  await (
    await users()
  ).insertOne({
    _id: memberId,
    _creationTime: Date.now(),
    name: "Test Member",
    email: "member@youngfounders.network",
    organizationId,
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    ...overrides,
  });
  return memberId;
}
