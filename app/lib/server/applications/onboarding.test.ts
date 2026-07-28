import { beforeEach, expect, test, vi } from "vitest";

vi.mock("../../auth/session", () => ({ requirePermission: vi.fn() }));

import { requirePermission } from "../../auth/session";
import { applications, logs } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application } from "../../db/types";
import { createTestActor } from "../../test/fixtures";
import { setupTestDatabase } from "../../test/setupTestDatabase";
import {
  startApplicationOnboarding,
  setApplicationOnboardingCompleted,
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

test("starts onboarding after the YBase profile was linked", async () => {
  await (
    await applications()
  ).updateOne({ _id: applicationId }, { $set: { onboardingUserId: newId() } });

  await startApplicationOnboarding({ applicationId });

  expect(
    await (await applications()).findOne({ _id: applicationId }),
  ).toMatchObject({
    onboardingStartedAt: expect.any(Number),
    onboardingStartedBy: actorId,
    history: expect.arrayContaining([
      expect.objectContaining({ details: "Onboarding gestartet" }),
    ]),
  });
  expect(
    await (
      await logs()
    ).findOne({
      entityId: applicationId,
      action: "application.onboarding_started",
    }),
  ).not.toBeNull();
});

test("requires a linked YBase profile before starting onboarding", async () => {
  await expect(startApplicationOnboarding({ applicationId })).rejects.toThrow(
    "bei YBase registriert",
  );
});

test("requires an accepted application before starting onboarding", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    { $set: { status: "review", onboardingUserId: newId() } },
  );

  await expect(startApplicationOnboarding({ applicationId })).rejects.toThrow(
    "nur nach einer Zusage",
  );
});

test("marks started onboarding as completed", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    {
      $set: {
        onboardingUserId: newId(),
        onboardingStartedAt: Date.now(),
        onboardingStartedBy: actorId,
      },
    },
  );

  await setApplicationOnboardingCompleted({
    applicationId,
    completed: true,
  });

  const stored = await (await applications()).findOne({ _id: applicationId });
  expect(stored).toMatchObject({
    onboardingCompletedAt: expect.any(Number),
    onboardingCompletedBy: actorId,
    history: expect.arrayContaining([
      expect.objectContaining({ details: "Onboarding abgeschlossen" }),
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

test("requires onboarding to be started before completing it", async () => {
  await expect(
    setApplicationOnboardingCompleted({
      applicationId,
      completed: true,
    }),
  ).rejects.toThrow("Starte zuerst das Onboarding");
});

test("reopens a previously completed onboarding", async () => {
  await (
    await applications()
  ).updateOne(
    { _id: applicationId },
    {
      $set: {
        onboardingUserId: newId(),
        onboardingStartedAt: Date.now(),
        onboardingStartedBy: actorId,
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
