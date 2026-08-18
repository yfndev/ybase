"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobPostings } from "../../db/collections";
import type { JobPosting } from "../../db/types";
import {
  isDeadlineInFuture,
  JOB_POSTING_DEADLINE_ERROR,
} from "../../jobPostings/deadline";
import { addLog } from "../logs";
import { createConfiguredTallyClient } from "../tally/client";
import { requireOwnedJobPosting } from "./access";
import {
  provisionTallyFormDraft,
  recordTallyFormError,
} from "./tallyFormProvisioning";

export type GenerateTallyFormResult =
  | { ok: true }
  | { ok: false; error: string };

function assertPublishable(posting: JobPosting): void {
  if (!posting.title.trim() || !posting.teamId.trim()) {
    throw new Error(
      "Titel und Team sind vor der Veröffentlichung erforderlich",
    );
  }
  if (!isDeadlineInFuture(posting.deadline)) {
    throw new Error(JOB_POSTING_DEADLINE_ERROR);
  }
}

async function requireDraft(jobPostingId: string) {
  const user = await requirePermission(USER_PERMISSIONS.publishJobPostings);
  const posting = await requireOwnedJobPosting(jobPostingId, user);
  if (posting.status !== "draft") {
    return {
      user,
      posting,
      error: "Nur Entwürfe können ein Tally-Formular erhalten",
    };
  }
  return { user, posting };
}

export async function generateTallyForm(input: {
  jobPostingId: string;
}): Promise<GenerateTallyFormResult> {
  const { jobPostingId } = z.object({ jobPostingId: z.string() }).parse(input);
  const draft = await requireDraft(jobPostingId);
  if (draft.error) return { ok: false, error: draft.error };
  const { posting, user } = draft;
  const collection = await jobPostings();

  try {
    assertPublishable(posting);
    const provisioned = await provisionTallyFormDraft(posting, user);
    if (!provisioned.ok) return provisioned;
    const client = createConfiguredTallyClient();
    await client.publishForm(provisioned.formId);
    await collection.updateOne(
      { _id: jobPostingId },
      {
        $set: { status: "published", tallyClosed: false },
        $unset: { tallyFormError: "" },
      },
    );
    await addLog(
      user.organizationId,
      user._id,
      "jobPosting.tally.publish",
      jobPostingId,
      "Manuell",
    );
    return { ok: true };
  } catch (error) {
    return recordTallyFormError(posting, user, error);
  }
}
