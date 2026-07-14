import { jobPostings } from "../../db/collections";
import type { JobPosting, JobPostingStatus } from "../../db/types";
import { berlinToday } from "../../jobPostings/deadline";
import { statusMeansClosed } from "../../jobPostings/status";
import { addLog } from "../logs";
import { createConfiguredTallyClient } from "../tally/client";

const SYSTEM_ACTOR = "system";

export async function syncTallyClosed(
  posting: JobPosting,
  desiredClosed: boolean,
  actorUserId: string,
): Promise<{ syncError?: string }> {
  const collection = await jobPostings();
  if (!posting.tallyFormId) {
    await collection.updateOne(
      { _id: posting._id },
      { $set: { tallyClosed: desiredClosed }, $unset: { tallyFormError: "" } },
    );
    return {};
  }

  try {
    const client = createConfiguredTallyClient();
    await client.updateForm(posting.tallyFormId, {
      settings: { isClosed: desiredClosed },
    });
    await collection.updateOne(
      { _id: posting._id },
      { $set: { tallyClosed: desiredClosed }, $unset: { tallyFormError: "" } },
    );
    return {};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    await collection.updateOne(
      { _id: posting._id },
      { $set: { tallyFormError: message } },
    );
    await addLog(
      posting.organizationId,
      actorUserId,
      "jobPosting.tally.error",
      posting._id,
      message,
    );
    return { syncError: message };
  }
}

export async function applyStatusTransition(params: {
  posting: JobPosting;
  nextStatus: JobPostingStatus;
  action: string;
  trigger: string;
  actorUserId: string;
}): Promise<{ syncError?: string }> {
  const collection = await jobPostings();
  await collection.updateOne(
    { _id: params.posting._id },
    { $set: { status: params.nextStatus } },
  );
  await addLog(
    params.posting.organizationId,
    params.actorUserId,
    params.action,
    params.posting._id,
    params.trigger,
  );
  return syncTallyClosed(
    params.posting,
    statusMeansClosed(params.nextStatus),
    params.actorUserId,
  );
}

export async function closeExpiredJobPostings(): Promise<{
  closed: number;
  syncErrors: number;
}> {
  const today = berlinToday();
  const collection = await jobPostings();
  const expired = await collection
    .find({ status: "published", deadline: { $gt: "", $lt: today } })
    .toArray();

  let closed = 0;
  let syncErrors = 0;
  for (const posting of expired) {
    const result = await applyStatusTransition({
      posting,
      nextStatus: "closed",
      action: "jobPosting.close",
      trigger: "Automatisch: Frist erreicht",
      actorUserId: SYSTEM_ACTOR,
    });
    closed += 1;
    if (result.syncError) syncErrors += 1;
  }
  return { closed, syncErrors };
}
