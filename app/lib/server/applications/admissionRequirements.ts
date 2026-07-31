"use server";

import { z } from "zod";
import { applications } from "../../db/collections";
import type { Application } from "../../db/types";
import { ageOnDate, assertAdmissionAge } from "../../members/legalDates";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { deliverGuardianConsentRequest } from "./guardianConsentDelivery";
import { createApplicationHistoryEntry } from "./history";
import { findApplicationMemberPlatformProfile } from "./memberPlatformAdmission";

const OPEN_STATUSES = ["received", "review", "interview"] as const;

export async function syncApplicationMemberPlatformProfile(input: {
  applicationId: string;
}): Promise<void> {
  const parsed = z.object({ applicationId: z.string().min(1) }).parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  assertRequirementsEditable(application);
  const snapshot = await findApplicationMemberPlatformProfile(
    application.applicantEmailNormalized,
  );
  const unchanged =
    application.memberPlatformUserId === snapshot.memberPlatformUserId &&
    application.dateOfBirth === snapshot.dateOfBirth;
  if (unchanged) return;
  if (application.guardianConsent?.signedAt) {
    throw new Error(
      "Die Member-Plattform-Daten sind durch die Zustimmung bereits bestätigt.",
    );
  }
  await storeMemberPlatformSnapshot(application, user._id, snapshot);
}

export async function requestGuardianConsent(input: {
  applicationId: string;
  representativeName: string;
  representativeEmail: string;
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      representativeName: z.string().trim().min(2).max(200),
      representativeEmail: z.string().trim().email().max(320),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  assertRequirementsEditable(application);
  if (!application.memberPlatformUserId || !application.dateOfBirth) {
    throw new Error(
      "Das Member-Plattform-Profil muss zuerst eindeutig verknüpft werden.",
    );
  }
  const now = Date.now();
  assertAdmissionAge(application.dateOfBirth, now);
  if (ageOnDate(application.dateOfBirth, now) >= 18) {
    throw new Error("Für Volljährige ist keine Vertretungszustimmung nötig.");
  }
  if (application.guardianConsent?.signedAt) {
    throw new Error("Die Vertretungszustimmung wurde bereits erteilt.");
  }

  const tokenHash = await deliverGuardianConsentRequest({
    application,
    representativeName: parsed.representativeName,
    representativeEmail: parsed.representativeEmail,
    requestedAt: now,
  });

  const entry = createApplicationHistoryEntry(
    user._id,
    "guardian_consent_requested",
    "Vertretungszustimmung angefordert",
  );
  await (
    await applications()
  ).updateOne(
    { _id: application._id, "guardianConsent.tokenHash": tokenHash },
    { $set: { updatedAt: entry.timestamp }, $push: { history: entry } },
  );
  try {
    await addLog(
      user.organizationId,
      user._id,
      "application.guardian_consent_requested",
      application._id,
    );
  } catch (error) {
    console.error("guardian consent audit log failed", error);
  }
}

function assertRequirementsEditable(application: Application): void {
  if (
    !OPEN_STATUSES.includes(
      application.status as (typeof OPEN_STATUSES)[number],
    )
  ) {
    throw new Error(
      "Die Aufnahmevoraussetzungen können nicht mehr geändert werden.",
    );
  }
}

async function storeMemberPlatformSnapshot(
  application: Application,
  actorUserId: string,
  snapshot: {
    memberPlatformUserId: string;
    memberPlatformSyncedAt: number;
    dateOfBirth: string;
  },
): Promise<void> {
  const entry = createApplicationHistoryEntry(
    actorUserId,
    "management_updated",
    "Member-Plattform-Profil für die Aufnahme synchronisiert",
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: application.organizationId,
      status: application.status,
      "guardianConsent.signedAt": { $exists: false },
    },
    {
      $set: { ...snapshot, updatedAt: entry.timestamp },
      ...(application.guardianConsent
        ? { $unset: { guardianConsent: "" } }
        : {}),
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1)
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
}
