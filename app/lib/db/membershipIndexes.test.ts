import { beforeEach, expect, test } from "vitest";
import { setupTestDatabase } from "../test/setupTestDatabase";
import {
  documentExecutions,
  membershipEvents,
  memberships,
  users,
} from "./collections";
import { newId } from "./ids";
import { ensureIndexes } from "./indexes";
import type { Membership } from "./types";

setupTestDatabase();

beforeEach(async () => {
  await ensureIndexes();
});

function membership(
  organizationId: string,
  userId: string,
  overrides: Partial<Membership> = {},
): Membership {
  const now = Date.now();
  return {
    _id: newId(),
    _creationTime: now,
    organizationId,
    userId,
    applicationId: newId(),
    membershipNumber: newId(),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: now,
    privateEmail: `${newId()}@example.org`,
    firstName: "Alex",
    lastName: "Example",
    dateOfBirth: "2005-01-01",
    handoverTasks: [],
    updatedAt: now,
    ...overrides,
  };
}

test("allows a new membership episode after an earlier membership ended", async () => {
  const organizationId = newId();
  const userId = newId();
  const memberPlatformUserId = newId();
  const collection = await memberships();
  await collection.insertOne(
    membership(organizationId, userId, {
      legalStatus: "ended",
      isCurrent: false,
      endedAt: Date.now(),
      endReason: "resignation",
      memberPlatformUserId,
    }),
  );
  await collection.insertOne(
    membership(organizationId, userId, { memberPlatformUserId }),
  );

  await expect(
    collection.insertOne(
      membership(organizationId, userId, {
        memberPlatformUserId: newId(),
      }),
    ),
  ).rejects.toMatchObject({ code: 11_000 });
  await expect(
    collection.insertOne(
      membership(organizationId, newId(), { memberPlatformUserId }),
    ),
  ).rejects.toMatchObject({ code: 11_000 });
});

test("allows renewed optional consent without overwriting its history", async () => {
  const now = Date.now();
  const organizationId = newId();
  const membershipId = newId();
  const documentVersionId = newId();
  const userId = newId();
  const collection = await documentExecutions();
  await collection.insertMany([
    {
      _id: newId(),
      _creationTime: now,
      organizationId,
      documentVersionId,
      documentHash: "first",
      membershipId,
      userId,
      executionType: "optional_consent",
      status: "revoked",
      assignedAt: now,
      completedAt: now + 1,
      revokedAt: now + 2,
    },
    {
      _id: newId(),
      _creationTime: now + 3,
      organizationId,
      documentVersionId,
      documentHash: "second",
      membershipId,
      userId,
      executionType: "optional_consent",
      status: "completed",
      assignedAt: now + 3,
      completedAt: now + 4,
    },
  ]);

  expect(await collection.countDocuments({ membershipId })).toBe(2);
});

test("scopes event idempotency keys to an organization", async () => {
  const now = Date.now();
  const idempotencyKey = newId();
  const collection = await membershipEvents();
  const event = {
    _creationTime: now,
    membershipId: newId(),
    userId: newId(),
    actorType: "system" as const,
    type: "membership.tested",
    idempotencyKey,
    occurredAt: now,
    details: {},
  };
  await collection.insertOne({
    ...event,
    _id: newId(),
    organizationId: "organization-a",
  });
  await collection.insertOne({
    ...event,
    _id: newId(),
    organizationId: "organization-b",
  });

  await expect(
    collection.insertOne({
      ...event,
      _id: newId(),
      organizationId: "organization-a",
    }),
  ).rejects.toMatchObject({ code: 11_000 });
});

test("prevents two users from claiming the same member-platform profile", async () => {
  const memberPlatformUserId = newId();
  const now = Date.now();
  const collection = await users();
  await collection.insertOne({
    _id: newId(),
    _creationTime: now,
    memberPlatformUserId,
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
  });

  await expect(
    collection.insertOne({
      _id: newId(),
      _creationTime: now,
      memberPlatformUserId,
      memberStatus: "onboarding",
      teamOnboardingStatus: "not_started",
    }),
  ).rejects.toMatchObject({ code: 11_000 });
});
