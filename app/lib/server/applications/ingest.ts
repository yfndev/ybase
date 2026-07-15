import type { Application, TallyWebhookEvent } from "../../db/application";
import {
  applications,
  jobPostings,
  tallyWebhookEvents,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { berlinToday, isDeadlinePassed } from "../../jobPostings/deadline";
import { addLog } from "../logs";
import { createApplicationFile } from "./fileRecord";
import { isDuplicateKeyError, recordWebhookEvent } from "./history";
import { parseTallySubmission, type TallyWebhookPayload } from "./tallyPayload";

export type IngestOutcome =
  | { status: "created"; applicationId: string }
  | { status: "duplicate" }
  | { status: "ignored"; reason: string };

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

export async function ingestTallySubmission(
  payload: TallyWebhookPayload,
): Promise<IngestOutcome> {
  const seen = await (
    await tallyWebhookEvents()
  ).findOne({
    _id: payload.eventId,
  });
  if (seen) return outcomeFromEvent(seen);

  const parsed = parseTallySubmission(payload);
  if (!parsed.jobPostingId) {
    await recordWebhookEvent(payload, "ignored", {
      reason: "missing-job-posting-id",
    });
    return { status: "ignored", reason: "missing-job-posting-id" };
  }

  const posting = await (
    await jobPostings()
  ).findOne({
    _id: parsed.jobPostingId,
  });
  if (!posting) {
    await recordWebhookEvent(payload, "ignored", {
      reason: "unknown-job-posting",
      jobPostingId: parsed.jobPostingId,
    });
    return { status: "ignored", reason: "unknown-job-posting" };
  }

  if (posting.tallyFormId !== payload.data.formId) {
    await recordWebhookEvent(payload, "ignored", {
      reason: "form-job-posting-mismatch",
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
    });
    return { status: "ignored", reason: "form-job-posting-mismatch" };
  }

  const unavailableReason =
    posting.status !== "published"
      ? "job-posting-not-open"
      : isDeadlinePassed(posting.deadline, berlinToday())
        ? "job-posting-expired"
        : undefined;
  if (unavailableReason) {
    await recordWebhookEvent(payload, "ignored", {
      reason: unavailableReason,
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
    });
    return { status: "ignored", reason: unavailableReason };
  }

  if (!parsed.email || !parsed.emailNormalized) {
    await recordWebhookEvent(payload, "ignored", {
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
    files: parsed.files.map(createApplicationFile),
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
    await recordWebhookEvent(payload, isSameEvent ? "processed" : "duplicate", {
      jobPostingId: posting._id,
      organizationId: posting.organizationId,
      applicationId: existing?._id,
    });
    return { status: "duplicate" };
  }

  await recordWebhookEvent(payload, "processed", {
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
