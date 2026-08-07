import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { membershipEvents, memberships, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Membership } from "../../db/types";
import { parseBerlinDate } from "../../members/berlinDate";
import { resignationEndAt } from "../../members/legalDates";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { recordMembershipResignation } from "./resignation";

setupTestDatabase();

let organizationId: string;
let memberId: string;
let membership: Membership;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime("2030-08-07T10:00:00Z");
  vi.clearAllMocks();
  organizationId = newId();
  memberId = newId();
  const actor = createTestActor({ organizationId });
  membership = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId,
    userId: memberId,
    applicationId: newId(),
    membershipNumber: "YFN-2030-TEST",
    isCurrent: true,
    legalStatus: "active",
    admittedAt: Date.parse("2030-01-01T11:00:00Z"),
    privateEmail: "member@example.org",
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    updatedAt: Date.now(),
  };
  await (await memberships()).insertOne(membership);
  await (
    await users()
  ).insertOne({
    _id: memberId,
    _creationTime: Date.now(),
    organizationId,
    membershipId: membership._id,
    name: "Alex Example",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  vi.mocked(requirePermission).mockResolvedValue(actor);
});

afterEach(() => {
  vi.useRealTimers();
});

test("records a resignation and starts the managed offboarding", async () => {
  const receivedOn = "2030-08-05";

  await expect(
    recordMembershipResignation({ userId: memberId, receivedOn }),
  ).resolves.toEqual({
    scheduledEndAt: resignationEndAt(parseBerlinDate(receivedOn)),
  });

  const updatedMembership = await (
    await memberships()
  ).findOne({ _id: membership._id });
  expect(updatedMembership).toMatchObject({
    legalStatus: "resigning",
    resignationReceivedAt: parseBerlinDate(receivedOn),
    scheduledEndAt: resignationEndAt(parseBerlinDate(receivedOn)),
    scheduledEndReason: "resignation",
  });
  expect(updatedMembership).not.toHaveProperty("handoverStartedAt");
  expect(updatedMembership).not.toHaveProperty("handoverTasks");
  expect(await (await users()).findOne({ _id: memberId })).toMatchObject({
    memberStatus: "offboarding_planned",
    offboardingPlannedAt: expect.any(Number),
  });
  expect(
    await (
      await membershipEvents()
    ).distinct("type", { membershipId: membership._id }),
  ).toEqual(["membership.end_scheduled"]);
});

test("accepts an idempotent retry for the same resignation", async () => {
  const input = { userId: memberId, receivedOn: "2030-08-05" };

  const first = await recordMembershipResignation(input);
  await expect(recordMembershipResignation(input)).resolves.toEqual(first);
});

test("rejects future and pre-membership resignation dates", async () => {
  await expect(
    recordMembershipResignation({
      userId: memberId,
      receivedOn: "2030-08-08",
    }),
  ).rejects.toThrow("nicht in der Zukunft");
  await expect(
    recordMembershipResignation({
      userId: memberId,
      receivedOn: "2029-12-31",
    }),
  ).rejects.toThrow("vor Beginn der Mitgliedschaft");
});

test("cannot record a resignation across organizations", async () => {
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: newId() }),
  );

  await expect(
    recordMembershipResignation({
      userId: memberId,
      receivedOn: "2030-08-05",
    }),
  ).rejects.toThrow("User not found");
});
