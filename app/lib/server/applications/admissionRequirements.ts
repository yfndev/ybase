"use server";

import { z } from "zod";
import { applications } from "../../db/collections";
import type { Application } from "../../db/types";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";
import {
  loadApplicationMemberPlatformSnapshot,
  searchApplicationMemberPlatformCandidates,
  type ApplicationMemberPlatformCandidate,
} from "./memberPlatformCandidates";
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
  const snapshot = await findApplicationMemberPlatformProfile({
    applicantName: application.applicantName,
    privateEmail: application.applicantEmailNormalized,
  });
  const unchanged =
    application.memberPlatformUserId === snapshot.memberPlatformUserId &&
    application.dateOfBirth === snapshot.dateOfBirth;
  if (unchanged) return;
  await storeMemberPlatformSnapshot(application, user._id, snapshot);
}

export async function searchApplicationMemberPlatformProfiles(input: {
  applicationId: string;
}): Promise<ApplicationMemberPlatformCandidate[]> {
  const parsed = z.object({ applicationId: z.string().min(1) }).parse(input);
  const { application } = await loadOwnedApplication(parsed.applicationId);
  assertRequirementsEditable(application);
  return searchApplicationMemberPlatformCandidates({
    applicantName: application.applicantName,
    privateEmail: application.applicantEmailNormalized,
  });
}

export async function selectApplicationMemberPlatformProfile(input: {
  applicationId: string;
  profileId: string;
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      profileId: z.string().trim().min(1).max(120),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  assertRequirementsEditable(application);
  const candidates = await searchApplicationMemberPlatformCandidates({
    applicantName: application.applicantName,
    privateEmail: application.applicantEmailNormalized,
  });
  if (!candidates.some(({ id }) => id === parsed.profileId)) {
    throw new Error("Member-Profil gehört nicht zu den Suchergebnissen.");
  }
  const snapshot = await loadApplicationMemberPlatformSnapshot(
    parsed.profileId,
  );
  const unchanged =
    application.memberPlatformUserId === snapshot.memberPlatformUserId &&
    application.dateOfBirth === snapshot.dateOfBirth;
  if (unchanged) return;
  await storeMemberPlatformSnapshot(application, user._id, snapshot);
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
    },
    {
      $set: { ...snapshot, updatedAt: entry.timestamp },
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1)
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
}
