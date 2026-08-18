import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  suspendWorkspaceUser: vi.fn(),
}));

import { memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership } from "../../db/types";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { syncEndedMembershipAccess } from "./accessClosure";

setupTestDatabase();

beforeEach(() => vi.mocked(suspendWorkspaceUser).mockReset());

test("does not suspend a replacement membership account during retries", async () => {
  const now = Date.now();
  const organizationId = newId();
  const userId = newId();
  const replacementMembershipId = newId();
  const membership: Membership = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: false,
    legalStatus: "ended",
    admittedAt: now - 1,
    endedAt: now,
    endReason: "resignation",
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    updatedAt: now,
  };
  await (await memberships()).insertOne(membership);
  await (
    await users()
  ).insertOne({
    _id: userId,
    _creationTime: now,
    organizationId,
    membershipId: replacementMembershipId,
    googleWorkspaceUserId: "google-user-1",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  await syncEndedMembershipAccess(membership);

  expect(suspendWorkspaceUser).not.toHaveBeenCalled();
  expect(await (await users()).findOne({ _id: userId })).toMatchObject({
    memberStatus: "active",
    membershipId: replacementMembershipId,
  });
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    workspaceSuspensionNotRequiredAt: expect.any(Number),
  });
});
