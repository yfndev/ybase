import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));
vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  suspendWorkspaceUser: vi.fn(),
}));

import { requirePermission } from "../../auth/session";
import { membershipEvents, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership } from "../../db/types";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { recordMemberDeath } from "./death";

setupTestDatabase();

let organizationId: string;
let membership: Membership;

beforeEach(async () => {
  organizationId = newId();
  const userId = newId();
  const now = Date.now();
  membership = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: now - 30 * 24 * 60 * 60 * 1_000,
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    handoverTasks: [],
    updatedAt: now,
  };
  await (await memberships()).insertOne(membership);
  await (
    await users()
  ).insertOne({
    _id: userId,
    _creationTime: now,
    organizationId,
    membershipId: membership._id,
    googleWorkspaceUserId: "google-user-1",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId }),
  );
  vi.mocked(suspendWorkspaceUser).mockReset().mockResolvedValue(undefined);
});

test("records death without member communication and closes access", async () => {
  const eventDate = Date.now() - 24 * 60 * 60 * 1_000;

  await recordMemberDeath({ membershipId: membership._id, eventDate });

  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    isCurrent: false,
    legalStatus: "ended",
    endReason: "death",
    endedAt: eventDate,
  });
  expect(
    await (await users()).findOne({ _id: membership.userId }),
  ).toMatchObject({
    memberStatus: "archived",
  });
  expect(
    await (await membershipEvents()).findOne({ membershipId: membership._id }),
  ).toMatchObject({
    type: "membership.ended",
    details: { reason: "death", effectiveAt: eventDate },
  });
  expect(suspendWorkspaceUser).toHaveBeenCalledWith("google-user-1");
});

test("cannot end a membership from another organization", async () => {
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: newId() }),
  );

  await expect(
    recordMemberDeath({
      membershipId: membership._id,
      eventDate: Date.now() - 24 * 60 * 60 * 1_000,
    }),
  ).rejects.toThrow("nicht gefunden");
});
