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
  return {
    ...application,
    jobPostingTitle,
    files: (application.files ?? []).map(
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
  ownerId: string | null;
  internalNotes: string;
  interviewAt: number | null;
}): Promise<void> {
  const parsed = z
    .object({
      applicationId: z.string().min(1),
      ownerId: z.string().min(1).nullable(),
      internalNotes: z.string().max(10_000),
      interviewAt: z.number().int().positive().nullable(),
    })
    .parse(input);
  const { user, application } = await loadOwnedApplication(
    parsed.applicationId,
  );

  if (parsed.ownerId) {
    const owner = await (
      await users()
    ).findOne({
      _id: parsed.ownerId,
      organizationId: user.organizationId,
      memberStatus: { $ne: "offboarded" },
    });
    if (!owner) throw new Error("Verantwortliche Person nicht verfügbar");
  }

  const nextNotes = parsed.internalNotes.trim();
  const details: string[] = [];
  if ((application.ownerId ?? null) !== parsed.ownerId) {
    details.push("Verantwortung geändert");
  }
  if ((application.internalNotes ?? "") !== nextNotes) {
    details.push("Interne Notizen aktualisiert");
  }
  if ((application.interviewAt ?? null) !== parsed.interviewAt) {
    details.push(
      parsed.interviewAt
        ? "Interviewtermin aktualisiert"
        : "Interviewtermin entfernt",
    );
  }
  if (details.length === 0) return;

  const entry = createApplicationHistoryEntry(
    user._id,
    "management_updated",
    details.join(" · "),
  );
  const set: Partial<Application> = {
    internalNotes: nextNotes,
    updatedAt: entry.timestamp,
  };
  const unset: Record<string, ""> = {};
  if (parsed.ownerId) set.ownerId = parsed.ownerId;
  else unset.ownerId = "";
  if (parsed.interviewAt) set.interviewAt = parsed.interviewAt;
  else unset.interviewAt = "";

  const result = await (
    await applications()
  ).updateOne(
    { _id: application._id, organizationId: user.organizationId },
    { $set: set, $unset: unset, $push: { history: entry } },
  );
  if (result.matchedCount !== 1) throw new Error("Bewerbung nicht gefunden");
  await addLog(
    user.organizationId,
    user._id,
    "application.management_update",
    application._id,
    details.join(", "),
  );
}
