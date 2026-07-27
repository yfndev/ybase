"use server";

import { z } from "zod";
import { emailDomain, normalizeYfnEmail } from "../../applications/yfnEmail";
import { applications, users } from "../../db/collections";
import type { Application } from "../../db/types";
import { YFN_ORGANIZATION } from "../../organization";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry, isDuplicateKeyError } from "./history";

const inputSchema = z.object({
  applicationId: z.string().min(1),
  yfnEmail: z.string().trim().email().max(320),
});

export async function setApplicationYfnEmail(
  input: z.input<typeof inputSchema>,
): Promise<void> {
  const parsed = inputSchema.parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (application.status !== "accepted") {
    throw new Error(
      "Eine YFN-E-Mail kann nur nach einer Zusage hinterlegt werden",
    );
  }
  if (application.onboardingUserId) {
    throw new Error("Diese Bewerbung wurde bereits mit einem Profil verknüpft");
  }
  if (application.workspaceUserId) {
    throw new Error(
      "Die E-Mail eines Workspace-Kontos kann hier nicht geändert werden",
    );
  }

  const [existingApplication, existingUser] = await Promise.all([
    (await applications()).findOne({
      _id: { $ne: application._id },
      yfnEmailNormalized: normalizeYfnEmail(parsed.yfnEmail),
    }),
    (await users()).findOne({ email: normalizeYfnEmail(parsed.yfnEmail) }),
  ]);
  const yfnEmail = normalizeYfnEmail(parsed.yfnEmail);
  if (emailDomain(yfnEmail) !== YFN_ORGANIZATION.domain) {
    throw new Error(`Die E-Mail muss auf @${YFN_ORGANIZATION.domain} enden`);
  }
  if (existingApplication) {
    throw new Error("Diese YFN-E-Mail ist bereits einer Bewerbung zugeordnet");
  }
  if (
    existingUser?.organizationId &&
    existingUser.organizationId !== user.organizationId
  ) {
    throw new Error(
      "Diese YFN-E-Mail gehört bereits zu einer anderen Organisation",
    );
  }
  if (
    existingUser?.applicationId &&
    existingUser.applicationId !== application._id
  ) {
    throw new Error(
      "Diese YFN-E-Mail ist bereits mit einer Bewerbung verknüpft",
    );
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    "YFN-E-Mail für das Onboarding hinterlegt",
  );
  const set: Partial<Application> = {
    yfnEmail,
    yfnEmailNormalized: yfnEmail,
    updatedAt: entry.timestamp,
  };
  try {
    const result = await (
      await applications()
    ).updateOne(
      {
        _id: application._id,
        organizationId: user.organizationId,
        status: "accepted",
        onboardingUserId: { $exists: false },
      },
      {
        $set: set,
        $unset: { onboardingLinkError: "" },
        $push: { history: entry },
      },
    );
    if (result.modifiedCount !== 1) {
      throw new Error("Bewerbung wurde zwischenzeitlich geändert");
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error("Diese YFN-E-Mail ist bereits vergeben");
    }
    throw error;
  }

  await addLog(
    user.organizationId,
    user._id,
    "application.yfn_email_set",
    application._id,
  );
}

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
  if (parsed.completed && !application.yfnEmailNormalized) {
    throw new Error("Speichere zuerst die eingerichtete YFN-E-Mail");
  }
  if (Boolean(application.onboardingCompletedAt) === parsed.completed) return;

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    parsed.completed ? "Onboarding beendet" : "Onboarding wieder geöffnet",
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
