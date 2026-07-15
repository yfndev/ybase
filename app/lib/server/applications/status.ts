"use server";

import { z } from "zod";
import { APPLICATION_STATUS_LABELS } from "../../applications/status";
import { isApplicationStatusTransitionAllowed } from "../../applications/transitions";
import { applications } from "../../db/collections";
import type { ApplicationStatus } from "../../db/types";
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
  if (result.modifiedCount !== 1)
    throw new Error("Bewerbung wurde zwischenzeitlich geändert");
  await addLog(
    user.organizationId,
    user._id,
    "application.status_change",
    application._id,
    entry.details,
  );
}
