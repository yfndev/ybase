import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import { requirePermission } from "../../auth/session";
import {
  applications,
  jobPostings,
  logs,
  organizations,
} from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  setApplicationOnboardingCompleted,
  setApplicationYfnEmail,
} from "./onboarding";

setupTestDatabase();

let organizationId: string;
let postingId: string;
let applicationId: string;
let actorId: string;

beforeEach(async () => {
  vi.clearAllMocks();
  organizationId = newId();
  postingId = newId();
  applicationId = newId();
  actorId = newId();
  vi.mocked(requirePermission).mockResolvedValue(
    createTestActor({ _id: actorId, organizationId }),
  );
  await (
    await organizations()
  ).insertOne({
    _id: organizationId,
    _creationTime: Date.now(),
    name: "YFN",
    domain: "youngfounders.network",
    createdBy: newId(),
  });
  await (
    await jobPostings()
  ).insertOne({
    _id: postingId,
    _creationTime: Date.now(),
    organizationId,
    teamId: newId(),
    status: "published",
    title: "People Lead",
    createdBy: newId(),
  });
  await insertApplication();
});

async function insertApplication(
  overrides: Partial<Application> = {},
): Promise<void> {
  await (
    await applications()
  ).insertOne({
    _id: overrides._id ?? applicationId,
    _creationTime: Date.now(),
    organizationId,
    jobPostingId: postingId,
    status: "accepted",
    applicantEmail: "private@example.com",
    applicantEmailNormalized: `private-${newId()}@example.com`,
    fields: [],
    files: [],
    tallyEventId: newId(),
    tallySubmissionId: newId(),
    tallyResponseId: newId(),
    tallyFormId: "form-1",
    submittedAt: Date.now(),
    ...overrides,
  });
}

test("stores a normalized YFN email on an accepted application", async () => {
  await setApplicationYfnEmail({
    applicationId,
    yfnEmail: "  Alex@YoungFounders.Network ",
  });

  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({
    yfnEmail: "alex@youngfounders.network",
    yfnEmailNormalized: "alex@youngfounders.network",
    history: [
      expect.objectContaining({
        details: "YFN-E-Mail für das Onboarding hinterlegt",
      }),
    ],
  });
  expect(
    await (await logs()).findOne({ entityId: applicationId }),
  ).toMatchObject({ action: "application.yfn_email_set" });
});

test("marks onboarding as completed", async () => {
  await setApplicationYfnEmail({
    applicationId,
    yfnEmail: "alex@youngfounders.network",
  });

  await setApplicationOnboardingCompleted({
    applicationId,
    completed: true,
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    onboardingCompletedAt: expect.any(Number),
    onboardingCompletedBy: actorId,
    history: expect.arrayContaining([
      expect.objectContaining({ details: "Onboarding beendet" }),
    ]),
  });
  expect(
    await (
      await logs()
    ).findOne({
      entityId: applicationId,
      action: "application.onboarding_completed",
    }),
  ).not.toBeNull();
});

test("requires the configured YFN email before completing onboarding", async () => {
  await expect(
    setApplicationOnboardingCompleted({
      applicationId,
      completed: true,
    }),
  ).rejects.toThrow("YFN-E-Mail");
});

test("reopens a previously completed onboarding", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    {
      $set: {
        yfnEmail: "alex@youngfounders.network",
        yfnEmailNormalized: "alex@youngfounders.network",
        onboardingCompletedAt: Date.now(),
        onboardingCompletedBy: actorId,
      },
    },
  );

  await setApplicationOnboardingCompleted({
    applicationId,
    completed: false,
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).not.toHaveProperty("onboardingCompletedAt");
  expect(stored).not.toHaveProperty("onboardingCompletedBy");
  expect(stored?.history?.at(-1)?.details).toBe("Onboarding wieder geöffnet");
});

test("rejects an email outside the organization domain", async () => {
  await expect(
    setApplicationYfnEmail({
      applicationId,
      yfnEmail: "alex@example.com",
    }),
  ).rejects.toThrow("@youngfounders.network");
});

test("rejects an email assigned to another application", async () => {
  await insertApplication({
    _id: newId(),
    yfnEmail: "alex@youngfounders.network",
    yfnEmailNormalized: "alex@youngfounders.network",
  });

  await expect(
    setApplicationYfnEmail({
      applicationId,
      yfnEmail: "alex@youngfounders.network",
    }),
  ).rejects.toThrow("bereits einer Bewerbung zugeordnet");
});

test("rejects a YFN email before the application is accepted", async () => {
  await (
    await applications()
  ).updateOne({ _id: applicationId }, { $set: { status: "review" } });

  await expect(
    setApplicationYfnEmail({
      applicationId,
      yfnEmail: "alex@youngfounders.network",
    }),
  ).rejects.toThrow("nur nach einer Zusage");
});

test("does not change the email after the profile was linked", async () => {
  await (
    await applications()
  ).updateOne({ _id: applicationId }, { $set: { onboardingUserId: newId() } });

  await expect(
    setApplicationYfnEmail({
      applicationId,
      yfnEmail: "alex@youngfounders.network",
    }),
  ).rejects.toThrow("bereits mit einem Profil verknüpft");
});
