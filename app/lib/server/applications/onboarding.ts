"use server";

import { z } from "zod";
import { applications } from "../../db/collections";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";

export async function setApplicationOnboardingCompleted(input: {
  applicationId: string;
  completed: boolean;
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      completed: z.boolean(),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (application.status !== "accepted") {
    throw new Error(
      "Das Onboarding kann nur nach einer Zusage bearbeitet werden",
    );
  }
  if (parsed.completed && !application.onboardingStartedAt) {
    throw new Error("Starte zuerst das Onboarding");
  }
  if (Boolean(application.onboardingCompletedAt) === parsed.completed) return;

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    parsed.completed
      ? "Onboarding abgeschlossen"
      : "Onboarding wieder geöffnet",
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: "accepted",
    },
    parsed.completed
      ? {
          $set: {
            onboardingCompletedAt: entry.timestamp,
            onboardingCompletedBy: user._id,
            updatedAt: entry.timestamp,
          },
          $push: { history: entry },
        }
      : {
          $set: { updatedAt: entry.timestamp },
          $unset: {
            onboardingCompletedAt: "",
            onboardingCompletedBy: "",
          },
          $push: { history: entry },
        },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  await addLog(
    user.organizationId,
    user._id,
    parsed.completed
      ? "application.onboarding_completed"
      : "application.onboarding_reopened",
    application._id,
  );
}

export async function startApplicationOnboarding(input: {
  applicationId: string;
}): Promise<void> {
  const parsed = z.object({ applicationId: z.string().min(1) }).parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (application.status !== "accepted") {
    throw new Error(
      "Das Onboarding kann nur nach einer Zusage gestartet werden",
    );
  }
  if (!application.onboardingUserId) {
    throw new Error("Die Person muss zuerst bei YBase registriert sein");
  }
  if (application.onboardingStartedAt) return;

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    "Onboarding gestartet",
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: "accepted",
      onboardingUserId: { $exists: true },
      onboardingStartedAt: { $exists: false },
    },
    {
      $set: {
        onboardingStartedAt: entry.timestamp,
        onboardingStartedBy: user._id,
        updatedAt: entry.timestamp,
      },
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  await addLog(
    user.organizationId,
    user._id,
    "application.onboarding_started",
    application._id,
  );
}
