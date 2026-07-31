import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../googleWorkspace/membershipLifecycle", () => ({
  suspendWorkspaceUser: vi.fn(),
}));

import { membershipEvents, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership, User } from "../../db/types";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { ageLimitAt } from "../../members/legalDates";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { processDailyMemberships } from "./dailyJob";

setupTestDatabase();

beforeEach(() => {
  vi.mocked(suspendWorkspaceUser).mockReset().mockResolvedValue(undefined);
});

async function seedMembership(
  input: {
    dateOfBirth?: string;
    membership?: Partial<Membership>;
    user?: Partial<User>;
  } = {},
): Promise<Membership> {
  const now = Date.parse("2030-01-01T12:00:00Z");
  const organizationId = newId();
  const userId = newId();
  const membership: Membership = {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: now,
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: input.dateOfBirth ?? "2005-07-01",
    handoverTasks: [],
    updatedAt: now,
    ...input.membership,
  };
  await (await memberships()).insertOne(membership);
  await (
    await users()
  ).insertOne({
    _id: userId,
    _creationTime: now,
    organizationId,
    membershipId: membership._id,
    email: "alex@youngfounders.network",
    googleWorkspaceUserId: "google-user-1",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    ...input.user,
  });
  return membership;
}

test("schedules age-out and creates the handover thirty days early", async () => {
  const now = Date.parse("2030-06-01T10:00:00Z");
  const membership = await seedMembership();

  const result = await processDailyMemberships(now);

  expect(result).toMatchObject({ ageOutsScheduled: 1, membershipsEnded: 0 });
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    legalStatus: "resigning",
    scheduledEndAt: ageLimitAt("2005-07-01"),
    scheduledEndReason: "age_limit",
    handoverStartedAt: expect.any(Number),
    handoverTasks: expect.arrayContaining([
      expect.objectContaining({ category: "successor" }),
      expect.objectContaining({ category: "external_accounts" }),
    ]),
  });
  expect(
    await (await users()).findOne({ _id: membership.userId }),
  ).toMatchObject({
    memberStatus: "offboarding_planned",
  });
  await (await membershipEvents()).deleteMany({ membershipId: membership._id });
  await processDailyMemberships(now + 1_000);
  expect(
    await (
      await membershipEvents()
    ).distinct("type", { membershipId: membership._id }),
  ).toEqual(
    expect.arrayContaining(["handover.started", "membership.end_scheduled"]),
  );
});

test("ends an age-limited membership and removes operational roles", async () => {
  const membership = await seedMembership({
    user: {
      role: "admin",
      teamId: "team-1",
      isTeamLead: true,
      boardMembership: { departmentId: "department-1", isChair: true },
    },
  });

  const result = await processDailyMemberships(
    Date.parse("2030-07-01T10:00:00Z"),
  );

  expect(result.membershipsEnded).toBe(1);
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    isCurrent: false,
    legalStatus: "ended",
    endReason: "age_limit",
    workspaceSuspendedAt: expect.any(Number),
  });
  const user = await (await users()).findOne({ _id: membership.userId });
  expect(user).toMatchObject({ memberStatus: "archived", role: "member" });
  expect(user).not.toHaveProperty("teamId");
  expect(user).not.toHaveProperty("boardMembership");
  expect(suspendWorkspaceUser).toHaveBeenCalledWith("google-user-1");
});

test("retries a failed Workspace suspension without reopening membership", async () => {
  vi.mocked(suspendWorkspaceUser).mockRejectedValue(new Error("offline"));
  const membership = await seedMembership();
  const now = Date.parse("2030-07-01T10:00:00Z");

  await processDailyMemberships(now);
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    legalStatus: "ended",
    workspaceSuspensionPendingAt: expect.any(Number),
  });

  vi.mocked(suspendWorkspaceUser).mockResolvedValue(undefined);
  await processDailyMemberships(now + 60_000);
  const updated = await (await memberships()).findOne({ _id: membership._id });
  expect(updated).toMatchObject({ workspaceSuspendedAt: expect.any(Number) });
  expect(updated).not.toHaveProperty("workspaceSuspensionPendingAt");
});

test("keeps an earlier resignation date ahead of age-out", async () => {
  const resignationAt = Date.parse("2030-06-15T22:00:00Z");
  const membership = await seedMembership({
    membership: {
      legalStatus: "resigning",
      scheduledEndAt: resignationAt,
      scheduledEndReason: "resignation",
      resignationReceivedAt: Date.parse("2029-09-01T10:00:00Z"),
    },
  });

  await processDailyMemberships(Date.parse("2030-06-01T10:00:00Z"));
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    scheduledEndAt: resignationAt,
    scheduledEndReason: "resignation",
  });

  await (
    await memberships()
  ).updateOne({ _id: membership._id }, { $set: { legalStatus: "suspended" } });
  await processDailyMemberships(Date.parse("2030-07-01T10:00:00Z"));
  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    legalStatus: "ended",
    endReason: "resignation",
  });
});

test("applies the age limit while membership rights are suspended", async () => {
  const membership = await seedMembership({
    membership: { legalStatus: "suspended" },
  });

  await processDailyMemberships(Date.parse("2030-07-01T10:00:00Z"));

  expect(
    await (await memberships()).findOne({ _id: membership._id }),
  ).toMatchObject({
    legalStatus: "ended",
    endReason: "age_limit",
  });
});
