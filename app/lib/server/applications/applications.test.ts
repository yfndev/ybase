import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { applications, jobPostings, logs, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  getApplication,
  getApplications,
  updateApplicationManagement,
} from "./management";
import { setApplicationStatus } from "./status";

let organizationId: string;
let foreignOrganizationId: string;
let actorId: string;
let postingId: string;
let applicationId: string;
let ownerId: string;
let secondOwnerId: string;

setupTestDatabase();

async function insertApplication(
  overrides: Partial<Application> = {},
): Promise<Application> {
  const id = overrides._id ?? newId();
  const application: Application = {
    _id: id,
    _creationTime: Date.now(),
    organizationId,
    jobPostingId: postingId,
    status: "received",
    applicantName: "Alex Beispiel",
    applicantEmail: "alex@example.com",
    applicantEmailNormalized: "alex@example.com",
    fields: [],
    files: [],
    tallyEventId: `event-${id}`,
    tallySubmissionId: `submission-${id}`,
    tallyResponseId: `response-${id}`,
    tallyFormId: "form-1",
    submittedAt: Date.now(),
    ...overrides,
  };
  await (await applications()).insertOne(application);
  return application;
}

beforeEach(async () => {
  vi.clearAllMocks();
  organizationId = newId();
  foreignOrganizationId = newId();
  actorId = newId();
  postingId = newId();
  applicationId = newId();
  ownerId = newId();
  secondOwnerId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({
      _id: actorId,
      organizationId,
      role: "people_culture",
    }),
  );
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "published",
    title: "Fundraising",
    createdBy: actorId,
  });
  await (
    await users()
  ).insertOne({
    _id: ownerId,
    _creationTime: Date.now(),
    organizationId,
    name: "Pat Owner",
    role: "people_culture",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  await (
    await users()
  ).insertOne({
    _id: secondOwnerId,
    _creationTime: Date.now(),
    organizationId,
    name: "Sam Owner",
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });
  await insertApplication({ _id: applicationId });
});

test("lists only applications from the actor organization with posting titles", async () => {
  await insertApplication({
    organizationId: foreignOrganizationId,
    applicantEmail: "foreign@example.com",
    applicantEmailNormalized: "foreign@example.com",
  });

  const result = await getApplications();

  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({
    _id: applicationId,
    jobPostingTitle: "Fundraising",
  });
});

test("loads one application without internal identifiers", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    {
      $set: {
        ownerIds: [ownerId],
        withdrawalTokenHash: "secret-withdrawal-hash",
        onboardingStartedBy: actorId,
        onboardingCompletedBy: actorId,
        dateOfBirth: "2004-01-01",
        memberPlatformUserId: "platform-alex",
        memberPlatformSyncedAt: Date.now(),
        admissionDecision: {
          result: "admitted",
          decidedAt: Date.now(),
          decidedBy: actorId,
          authority: "board_member",
          recordedAt: Date.now(),
          recordedBy: actorId,
        },
        rejectionDelivery: {
          channel: "email",
          recipient: "alex@example.com",
          messageId: "secret-message-id",
        },
        appealTokenHash: "secret-appeal-hash",
        appealStatement: "Interner Beschwerdetext",
        appealDecision: {
          result: "rejected",
          decidedAt: Date.now(),
          recordedAt: Date.now(),
          recordedBy: actorId,
        },
        fields: [
          {
            key: "phone-in-fields",
            label: "Telefon",
            type: "INPUT_PHONE_NUMBER",
            value: "+49 151 23456789",
          },
        ],
      },
    },
  );

  const application = await getApplication(applicationId);
  expect(application).toMatchObject({
    _id: applicationId,
    jobPostingTitle: "Fundraising",
    ownerIds: [ownerId],
    dateOfBirth: "2004-01-01",
    memberPlatformUserId: "platform-alex",
    memberPlatformSyncedAt: expect.any(Number),
  });
  expect(application).not.toHaveProperty("applicantPhone");
  expect(application).not.toHaveProperty("applicantEmailNormalized");
  expect(application).not.toHaveProperty("tallyEventId");
  expect(application).not.toHaveProperty("tallySubmissionId");
  expect(application).not.toHaveProperty("tallyResponseId");
  expect(application).not.toHaveProperty("tallyFormId");
  expect(application).not.toHaveProperty("withdrawalTokenHash");
  expect(application).not.toHaveProperty("admissionDecision");
  expect(application).not.toHaveProperty("rejectionDelivery");
  expect(application).not.toHaveProperty("appealTokenHash");
  expect(application).not.toHaveProperty("appealStatement");
  expect(application).not.toHaveProperty("appealDecision");
  expect(application).not.toHaveProperty("onboardingStartedBy");
  expect(application).not.toHaveProperty("onboardingCompletedBy");
});

test("stores multiple responsible people and an internal history entry", async () => {
  await updateApplicationManagement({
    applicationId,
    ownerIds: [ownerId, secondOwnerId],
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({ ownerIds: [ownerId, secondOwnerId] });
  expect(stored?.history?.[0]).toMatchObject({
    actorUserId: actorId,
    type: "management_updated",
  });
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({
    action: "application.management_update",
  });
});

test("removes an assigned owner", async () => {
  await updateApplicationManagement({
    applicationId,
    ownerIds: [ownerId],
  });
  await updateApplicationManagement({
    applicationId,
    ownerIds: [],
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.ownerIds).toEqual([]);
});

test("rejects an owner from another organization", async () => {
  const foreignOwnerId = newId();
  await (
    await users()
  ).insertOne({
    _id: foreignOwnerId,
    _creationTime: Date.now(),
    organizationId: foreignOrganizationId,
    role: "member",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
  });

  await expect(
    updateApplicationManagement({
      applicationId,
      ownerIds: [ownerId, foreignOwnerId],
    }),
  ).rejects.toThrow("nicht verfügbar");
});

test("enforces allowed non-decision transitions and records them", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    {
      $set: {
        memberPlatformUserId: "platform-alex",
        dateOfBirth: "2004-01-01",
      },
    },
  );
  await setApplicationStatus({ applicationId, status: "interview" });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    status: "interview",
    memberPlatformUserId: "platform-alex",
    dateOfBirth: "2004-01-01",
  });
  expect(stored?.history).toHaveLength(1);
  expect(stored?.history?.at(-1)).toMatchObject({
    fromStatus: "received",
    toStatus: "interview",
  });
  await expect(
    setApplicationStatus({ applicationId, status: "review" }),
  ).rejects.toThrow("nicht zulässig");
});

test("requires a member-platform profile before an interview", async () => {
  await expect(
    setApplicationStatus({ applicationId, status: "interview" }),
  ).rejects.toThrow("Member-Plattform-Profil");
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({ status: "received" });
});

test("requires acceptance and rejection to use the email action", async () => {
  await expect(
    setApplicationStatus({ applicationId, status: "rejected" }),
  ).rejects.toThrow("per E-Mail");
  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({ status: "received" });
});

test("reserves the withdrawn status for the secure public flow", async () => {
  await expect(
    setApplicationStatus({ applicationId, status: "withdrawn" }),
  ).rejects.toThrow("nicht zulässig");
});

test("blocks management changes after a withdrawal", async () => {
  await (
    await applications()
  ).updateOne({ _id: applicationId }, { $set: { status: "withdrawn" } });

  await expect(
    updateApplicationManagement({
      applicationId,
      ownerIds: [],
    }),
  ).rejects.toThrow("nicht bearbeitet");
});

test("cannot read or update an application from another organization", async () => {
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ organizationId: foreignOrganizationId }),
  );

  await expect(
    setApplicationStatus({ applicationId, status: "review" }),
  ).rejects.toThrow("Bewerbung nicht gefunden");
  await expect(getApplication(applicationId)).rejects.toThrow(
    "Bewerbung nicht gefunden",
  );
  await expect(getApplications()).resolves.toEqual([]);
});
