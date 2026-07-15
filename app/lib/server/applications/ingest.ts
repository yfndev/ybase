import type { Application, TallyWebhookEvent } from "../../db/application";
import {
  applications,
  jobPostings,
  tallyWebhookEvents,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";
import { parseTallySubmission, type TallyWebhookPayload } from "./tallyPayload";

export type IngestOutcome =
  | { status: "created"; applicationId: string }
  | { status: "duplicate" }
  | { status: "ignored"; reason: string };

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

function toTimestamp(value?: string): number {
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function outcomeFromEvent(event: TallyWebhookEvent): IngestOutcome {
  if (event.status === "ignored") {
    return { status: "ignored", reason: event.reason ?? "ignored" };
  }
  return { status: "duplicate" };
}

type EventDetails = Partial<
  Pick<
    TallyWebhookEvent,
    "jobPostingId" | "organizationId" | "applicationId" | "reason"
  >
>;

async function recordEvent(
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

export async function ingestTallySubmission(
  payload: TallyWebhookPayload,
): Promise<IngestOutcome> {
  const seen = await (
    await tallyWebhookEvents()
  ).findOne({ _id: payload.eventId });
  if (seen) return outcomeFromEvent(seen);

  const parsed = parseTallySubmission(payload);
  if (!parsed.jobPostingId) {
    await recordEvent(payload, "ignored", { reason: "missing-job-posting-id" });
    return { status: "ignored", reason: "missing-job-posting-id" };
  }

  const posting = await (
    await jobPostings()
  ).findOne({ _id: parsed.jobPostingId });
  if (!posting) {
    await recordEvent(payload, "ignored", {
      reason: "unknown-job-posting",
      jobPostingId: parsed.jobPostingId,
    });
    return { status: "ignored", reason: "unknown-job-posting" };
  }

  if (posting.tallyFormId !== payload.data.formId) {
    await recordEvent(payload, "ignored", {
      reason: "form-job-posting-mismatch",
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
    });
    return { status: "ignored", reason: "form-job-posting-mismatch" };
  }

  if (!parsed.email || !parsed.emailNormalized) {
    await recordEvent(payload, "ignored", {
      reason: "missing-email",
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
    });
    return { status: "ignored", reason: "missing-email" };
  }

  const application: Application = {
    _id: newId(),
    _creationTime: Date.now(),
    organizationId: posting.organizationId,
    jobPostingId: posting._id,
    status: "received",
    applicantName: parsed.name,
    applicantEmail: parsed.email,
    applicantEmailNormalized: parsed.emailNormalized,
    fields: parsed.fields,
    tallyEventId: payload.eventId,
    tallySubmissionId: payload.data.submissionId,
    tallyResponseId: payload.data.responseId,
    tallyFormId: payload.data.formId,
    submittedAt: toTimestamp(payload.data.createdAt),
  };

  const applicationCollection = await applications();
  try {
    await applicationCollection.insertOne(application);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const existing = await applicationCollection.findOne({
      $or: [
        { tallyEventId: payload.eventId },
        { tallySubmissionId: payload.data.submissionId },
        { tallyResponseId: payload.data.responseId },
        {
          jobPostingId: posting._id,
          applicantEmailNormalized: parsed.emailNormalized,
        },
      ],
    });
    const isSameEvent = existing?.tallyEventId === payload.eventId;
    await recordEvent(payload, isSameEvent ? "processed" : "duplicate", {
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
      applicationId: existing?._id,
    });
    return { status: "duplicate" };
  }

  await recordEvent(payload, "processed", {
    jobPostingId: posting._id,
    organizationId: posting.organizationId,
    applicationId: application._id,
  });
  try {
    await addLog(
      posting.organizationId,
      "tally-webhook",
      "application.received",
      application._id,
      posting.title,
    );
  } catch (error) {
    console.error("application audit log failed", error);
  }

  return { status: "created", applicationId: application._id };
}
