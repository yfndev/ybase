"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobPostings } from "../../db/collections";
import type { JobPosting } from "../../db/types";
import {
  JOB_POSTING_HIDDEN_FIELD,
  normalizeTemplateBlocks,
  resolveEmailFieldUuid,
  withHiddenField,
} from "../../tally/formTemplate";
import { addLog } from "../logs";
import { createConfiguredTallyClient } from "../tally/client";
import { loadTallyFormConfig } from "../tally/config";

type TallyFields = Partial<
  Pick<JobPosting, "tallyFormId" | "tallyWebhookId" | "tallyFormError">
>;

export async function generateTallyForm(input: {
  jobPostingId: string;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const { jobPostingId } = z.object({ jobPostingId: z.string() }).parse(input);

  const collection = await jobPostings();
  const posting = await collection.findOne({ _id: jobPostingId });
  if (!posting || posting.organizationId !== user.organizationId) {
    throw new Error("Access denied");
  }
  if (posting.status !== "draft") {
    throw new Error("Nur Entwürfe können ein Tally-Formular erhalten");
  }

  const config = loadTallyFormConfig();
  const client = createConfiguredTallyClient();
  const save = (fields: TallyFields) =>
    collection.updateOne({ _id: jobPostingId }, { $set: fields });

  try {
    const template = await client.getForm(config.templateFormId);
    const emailFieldUuid = resolveEmailFieldUuid(template.blocks);
    const blocks = normalizeTemplateBlocks(template.blocks);

    let tallyFormId = posting.tallyFormId;
    if (!tallyFormId) {
      const created = await client.createForm({
        templateId: config.templateFormId,
        workspaceId: config.workspaceId,
        blocks,
      });
      tallyFormId = created.id;
      await save({ tallyFormId });
    }

    await client.updateForm(tallyFormId, {
      blocks: withHiddenField(blocks, JOB_POSTING_HIDDEN_FIELD),
      settings: { uniqueSubmissionKey: emailFieldUuid },
    });

    if (!posting.tallyWebhookId) {
      const webhook = await client.createWebhook({
        formId: tallyFormId,
        url: config.webhookUrl,
        signingSecret: config.webhookSigningSecret,
      });
      await save({ tallyWebhookId: webhook.id });
    }

    await client.publishForm(tallyFormId);
    await collection.updateOne(
      { _id: jobPostingId },
      { $set: { status: "published" }, $unset: { tallyFormError: "" } },
    );
    await addLog(
      user.organizationId,
      user._id,
      "jobPosting.tally.publish",
      jobPostingId,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    await save({ tallyFormError: message });
    await addLog(
      user.organizationId,
      user._id,
      "jobPosting.tally.error",
      jobPostingId,
      message,
    );
    throw new Error(message);
  }
}
