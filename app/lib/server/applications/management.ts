"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications, jobPostings, users } from "../../db/collections";
import type { Application, ApplicationWithFiles } from "../../db/types";
import { addLog } from "../logs";
import {
  loadOwnedApplication,
  requireRecruitingApplicationFile,
  requireRecruitingJobPosting,
} from "./access";
import { createApplicationHistoryEntry } from "./history";

function toApplicationView(
  application: Application,
  jobPostingTitle: string,
): ApplicationWithFiles {
  const {
    applicantEmailNormalized: _applicantEmailNormalized,
    files,
    tallyEventId: _tallyEventId,
    tallySubmissionId: _tallySubmissionId,
    tallyResponseId: _tallyResponseId,
    tallyFormId: _tallyFormId,
    withdrawalTokenHash: _withdrawalTokenHash,
    yfnEmailNormalized: _yfnEmailNormalized,
    onboardingCompletedBy: _onboardingCompletedBy,
    cleanupEligibleAt: _cleanupEligibleAt,
    ownerIds,
    ...visibleApplication
  } = application;
  return {
    ...visibleApplication,
    jobPostingTitle,
    ownerIds: ownerIds ?? [],
    files: files.map(
      ({ sourceUrl: _sourceUrl, storageKey: _storageKey, ...file }) => file,
    ),
  };
}

export async function getApplications(): Promise<ApplicationWithFiles[]> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const [records, postings] = await Promise.all([
    (await applications())
      .find({ organizationId: user.organizationId })
      .sort({ _creationTime: -1 })
      .toArray(),
    (await jobPostings())
      .find({ organizationId: user.organizationId })
      .project({ _id: 1, title: 1 })
      .toArray(),
  ]);
  const titles = new Map(
    postings.map((posting) => [posting._id, posting.title]),
  );
  return records.map((application) =>
    toApplicationView(
      application,
      titles.get(application.jobPostingId) ?? "Unbekannte Ausschreibung",
    ),
  );
}

export async function getApplication(
  applicationId: string,
): Promise<ApplicationWithFiles> {
  const { user, application } = await loadOwnedApplication(applicationId);
  const posting = await (
    await jobPostings()
  ).findOne({
    _id: application.jobPostingId,
    organizationId: user.organizationId,
  });
  return toApplicationView(
    application,
    posting?.title ?? "Unbekannte Ausschreibung",
  );
}

export async function getApplicationsForJobPosting(
  jobPostingId: string,
): Promise<ApplicationWithFiles[]> {
  const { user, posting } = await requireRecruitingJobPosting(jobPostingId);
  const records = await (await applications())
    .find({ organizationId: user.organizationId, jobPostingId })
    .sort({ _creationTime: -1 })
    .toArray();
  return records.map((application) =>
    toApplicationView(application, posting.title),
  );
}

export async function queueApplicationFileRetry(
  fileId: string,
): Promise<string> {
  const { application, file } = await requireRecruitingApplicationFile(fileId);
  if (file.status === "rejected") {
    throw new Error("Abgelehnte Dateien können nicht erneut importiert werden");
  }
  if (file.status === "failed") {
    await (
      await applications()
    ).updateOne(
      { _id: application._id },
      {
        $set: {
          "files.$[file].status": "pending",
          "files.$[file].updatedAt": Date.now(),
        },
        $unset: { "files.$[file].error": "" },
      },
      { arrayFilters: [{ "file._id": fileId, "file.status": "failed" }] },
    );
  }
  return application._id;
}

export async function updateApplicationManagement(input: {
  applicationId: string;
  ownerIds: string[];
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      ownerIds: z
        .array(z.string().min(1))
        .max(20)
        .transform((ownerIds) => [...new Set(ownerIds)]),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );
  if (application.status === "withdrawn") {
    throw new Error(
      "Zurückgezogene Bewerbungen können nicht bearbeitet werden",
    );
  }

  if (parsed.ownerIds.length > 0) {
    const availableOwners = await (
      await users()
    ).countDocuments({
      _id: { $in: parsed.ownerIds },
      organizationId: user.organizationId,
      memberStatus: { $ne: "offboarded" },
    });
    if (availableOwners !== parsed.ownerIds.length) {
      throw new Error(
        "Mindestens eine verantwortliche Person ist nicht verfügbar",
      );
    }
  }

  const currentOwnerIds = application.ownerIds ?? [];
  if (
    currentOwnerIds.length === parsed.ownerIds.length &&
    currentOwnerIds.every((ownerId) => parsed.ownerIds.includes(ownerId))
  ) {
    return;
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    "Verantwortliche geändert",
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: { $ne: "withdrawn" },
    },
    {
      $set: {
        ownerIds: parsed.ownerIds,
        updatedAt: entry.timestamp,
      },
      $push: { history: entry },
    },
  );
  if (result.matchedCount !== 1) throw new Error("Bewerbung nicht gefunden");
  await addLog(
    user.organizationId,
    user._id,
    "application.management_update",
    application._id,
    entry.details,
  );
}
