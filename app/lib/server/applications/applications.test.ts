import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { applications, jobPostings, logs, users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import { getApplications, updateApplicationManagement } from "./management";
import { setApplicationStatus } from "./status";

let organizationId: string;
let foreignOrganizationId: string;
let actorId: string;
let postingId: string;
let applicationId: string;
let ownerId: string;

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

test("stores management fields and an internal history entry", async () => {
  const interviewAt = Date.now() + 86_400_000;
  await updateApplicationManagement({
    applicationId,
    ownerId,
    internalNotes: "Gute Vorerfahrung",
    interviewAt,
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    ownerId,
    internalNotes: "Gute Vorerfahrung",
    interviewAt,
  });
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

test("removes an assigned owner and interview date", async () => {
  await updateApplicationManagement({
    applicationId,
    ownerId,
    internalNotes: "",
    interviewAt: Date.now() + 86_400_000,
  });
  await updateApplicationManagement({
    applicationId,
    ownerId: null,
    internalNotes: "",
    interviewAt: null,
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.ownerId).toBeUndefined();
  expect(stored?.interviewAt).toBeUndefined();
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
      ownerId: foreignOwnerId,
      internalNotes: "",
      interviewAt: null,
    }),
  ).rejects.toThrow("Verantwortliche Person nicht verfügbar");
});

test("enforces allowed non-decision transitions and records them", async () => {
  await setApplicationStatus({ applicationId, status: "review" });
  await setApplicationStatus({ applicationId, status: "interview" });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored?.status).toBe("interview");
  expect(stored?.history).toHaveLength(2);
  await expect(
    setApplicationStatus({ applicationId, status: "review" }),
  ).rejects.toThrow("nicht zulässig");
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
      ownerId: null,
      internalNotes: "Neue Notiz",
      interviewAt: null,
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
  await expect(getApplications()).resolves.toEqual([]);
});
