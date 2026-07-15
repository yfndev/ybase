"use server";

import { z } from "zod";
import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications } from "../../db/collections";
import type {
  ApplicationFile,
  ApplicationFileStatus,
  ApplicationStatus,
} from "../../db/types";
import { addLog } from "../logs";
import { loadOwnedApplication } from "./access";
import { createApplicationHistoryEntry } from "./history";

const statusSchema = z.enum([
  "received",
  "review",
  "interview",
  "accepted",
  "rejected",
  "withdrawn",
]);

export async function setApplicationStatus(input: {
  applicationId: string;
  status: ApplicationStatus;
}): Promise<void> {
  const { applicationId, status } = z
    .object({ applicationId: z.string().min(1), status: statusSchema })
    .parse(input);
  const { user, application } = await loadOwnedApplication(applicationId);
  if (
    status === "received" ||
    !isApplicationStatusTransitionAllowed(application.status, status)
  ) {
    throw new Error("Dieser Statuswechsel ist nicht zulässig");
  }

  const entry = createApplicationHistoryEntry(
    user._id,
    "status_changed",
    `${APPLICATION_STATUS_LABELS[application.status]} → ${APPLICATION_STATUS_LABELS[status]}`,
    { fromStatus: application.status, toStatus: status },
  );
  const result = await (
    await applications()
  ).updateOne(
    {
      _id: application._id,
      organizationId: user.organizationId,
      status: application.status,
    },
    {
      $set: { status, updatedAt: entry.timestamp },
      $push: { history: entry },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  }
  await addLog(
    user.organizationId,
    user._id,
    "application.status_change",
    application._id,
    entry.details,
  );
}

export async function setApplicationFileStatus(
  applicationId: string,
  fileId: string,
  status: ApplicationFileStatus,
  details: { error?: string; storageKey?: string; importedAt?: number } = {},
): Promise<void> {
  const set: Record<string, unknown> = {
    "files.$[file].status": status,
    "files.$[file].updatedAt": Date.now(),
    ...(details.error ? { "files.$[file].error": details.error } : {}),
    ...(details.storageKey
      ? { "files.$[file].storageKey": details.storageKey }
      : {}),
    ...(details.importedAt
      ? { "files.$[file].importedAt": details.importedAt }
      : {}),
  };
  const update: Record<string, unknown> = { $set: set };
  if (!details.error) update.$unset = { "files.$[file].error": "" };
  await (
    await applications()
  ).updateOne({ _id: applicationId }, update, {
    arrayFilters: [{ "file._id": fileId }],
  });
}

export async function claimApplicationFile(
  applicationId: string,
  fileId: string,
): Promise<ApplicationFile | null> {
  const collection = await applications();
  const application = await collection.findOne({
    _id: applicationId,
    files: {
      $elemMatch: { _id: fileId, status: { $in: ["pending", "failed"] } },
    },
  });
  const file = application?.files.find((candidate) => candidate._id === fileId);
  if (!file) return null;
  const claimed = await collection.updateOne(
    { _id: applicationId },
    {
      $set: {
        "files.$[file].status": "importing",
        "files.$[file].updatedAt": Date.now(),
      },
      $inc: { "files.$[file].attempts": 1 },
      $unset: { "files.$[file].error": "" },
    },
    { arrayFilters: [{ "file._id": fileId, "file.status": file.status }] },
  );
  return claimed.modifiedCount === 1 ? file : null;
}
