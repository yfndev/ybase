import type {
  Application,
  ApplicationFile,
  TallyWebhookEvent,
} from "../../db/application";
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

function applicationFile(
  file: ReturnType<typeof parseTallySubmission>["files"][number],
): ApplicationFile {
  const now = Date.now();
  return {
    _id: newId(),
    fieldKey: file.fieldKey,
    fieldLabel: file.fieldLabel,
    sourceId: file.sourceId,
    sourceUrl: file.sourceUrl,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    status: file.validationError ? "rejected" : "pending",
    attempts: 0,
    error: file.validationError,
    updatedAt: now,
  };
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
  await (
    await tallyWebhookEvents()
  ).updateOne(
    { _id: payload.eventId },
    {
      $set: {
        eventType: payload.eventType,
        submissionId: payload.data.submissionId,
        status,
        ...details,
      },
      $setOnInsert: { _creationTime: Date.now() },
    },
    { upsert: true },
  );
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
    applicantPhone: parsed.phone,
    fields: parsed.fields,
    files: parsed.files.map(applicationFile),
    tallyEventId: payload.eventId,
    tallySubmissionId: payload.data.submissionId,
    tallyResponseId: payload.data.responseId,
    tallyFormId: payload.data.formId,
    submittedAt: toTimestamp(payload.data.createdAt),
  };

  try {
    await (await applications()).insertOne(application);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    await recordEvent(payload, "duplicate", {
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
    });
    return { status: "duplicate" };
  }

  await recordEvent(payload, "processed", {
    jobPostingId: posting._id,
    organizationId: posting.organizationId,
    applicationId: application._id,
  });
  await addLog(
    posting.organizationId,
    "tally-webhook",
    "application.received",
    application._id,
    posting.title,
  );

  return { status: "created", applicationId: application._id };
}
