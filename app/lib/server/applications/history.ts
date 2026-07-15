import type { TallyWebhookEvent } from "../../db/application";
import { tallyWebhookEvents } from "../../db/collections";
import { newId } from "../../db/ids";
import type {
  ApplicationHistoryEntry,
  ApplicationStatus,
} from "../../db/types";
import type { TallyWebhookPayload } from "./tallyPayload";

type EventDetails = Partial<
  Pick<
    TallyWebhookEvent,
    "jobPostingId" | "organizationId" | "applicationId" | "reason"
  >
>;

export function createApplicationHistoryEntry(
  actorUserId: string,
  type: ApplicationHistoryEntry["type"],
  details: string,
  status?: { fromStatus: ApplicationStatus; toStatus: ApplicationStatus },
): ApplicationHistoryEntry {
  return {
    _id: newId(),
    timestamp: Date.now(),
    actorUserId,
    type,
    details,
    ...status,
  };
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

export async function recordWebhookEvent(
  payload: TallyWebhookPayload,
  status: TallyWebhookEvent["status"],
  details: EventDetails,
): Promise<void> {
  const collection = await tallyWebhookEvents();
  const event = {
    eventType: payload.eventType,
    submissionId: payload.data.submissionId,
    status,
    ...details,
  };

  if (status === "processed") {
    await collection.updateOne(
      { _id: payload.eventId },
      { $set: event, $setOnInsert: { _creationTime: Date.now() } },
      { upsert: true },
    );
    return;
  }

  const result = await collection.updateOne(
    { _id: payload.eventId, status: { $ne: "processed" } },
    { $set: event },
  );
  if (result.matchedCount > 0) return;
  try {
    await collection.insertOne({
      _id: payload.eventId,
      _creationTime: Date.now(),
      ...event,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
  }
}
