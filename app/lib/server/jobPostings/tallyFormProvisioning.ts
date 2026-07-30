import { jobPostings } from "../../db/collections";
import type { JobPosting } from "../../db/types";
import {
  JOB_POSTING_HIDDEN_FIELD,
  normalizeTemplateBlocks,
  resolveEmailFieldUuid,
  withHiddenField,
  withRequiredPhoneField,
} from "../../tally/formTemplate";
import {
  jobPostingFormTitle,
  withJobPostingContent,
} from "../../tally/jobPostingFormTemplate";
import type { TallyBlock } from "../../tally/types";
import { addLog } from "../logs";
import { createConfiguredTallyClient } from "../tally/client";
import { loadTallyFormConfig } from "../tally/config";

type Actor = { _id: string; organizationId: string };

export type ProvisionTallyFormResult =
  | { ok: true; formId: string }
  | { ok: false; error: string };

export async function recordTallyFormError(
  posting: JobPosting,
  actor: Actor,
  error: unknown,
): Promise<{ ok: false; error: string }> {
  const message = error instanceof Error ? error.message : "Unbekannter Fehler";
  await (
    await jobPostings()
  ).updateOne(
    { _id: posting._id, organizationId: actor.organizationId },
    { $set: { tallyFormError: message } },
  );
  await addLog(
    actor.organizationId,
    actor._id,
    "jobPosting.tally.error",
    posting._id,
    message,
  );
  return { ok: false, error: message };
}

export async function provisionTallyFormDraft(
  posting: JobPosting,
  actor: Actor,
): Promise<ProvisionTallyFormResult> {
  const collection = await jobPostings();

  try {
    const config = loadTallyFormConfig();
    const client = createConfiguredTallyClient();
    const formTitle = jobPostingFormTitle(posting.title);
    let formId = posting.tallyFormId;
    let blocks: TallyBlock[];
    let emailFieldUuid: string;
    let isNewForm = false;

    if (formId) {
      const existingForm = await client.getForm(formId);
      blocks = withRequiredPhoneField(
        withJobPostingContent(existingForm.blocks, posting),
      );
      emailFieldUuid = resolveEmailFieldUuid(blocks);
    } else {
      const templateFormId =
        posting.tallyTemplateFormId ?? config.templateFormId;
      const template = await client.getForm(templateFormId);
      blocks = withRequiredPhoneField(
        withJobPostingContent(
          normalizeTemplateBlocks(template.blocks),
          posting,
        ),
      );
      emailFieldUuid = resolveEmailFieldUuid(blocks);
      const created = await client.createForm({
        templateId: templateFormId,
        workspaceId: config.workspaceId,
        blocks,
      });
      formId = created.id;
      isNewForm = true;
      await collection.updateOne(
        { _id: posting._id, organizationId: actor.organizationId },
        { $set: { tallyFormId: formId } },
      );
    }

    await client.updateForm(formId, {
      name: formTitle,
      blocks: withHiddenField(blocks, JOB_POSTING_HIDDEN_FIELD),
      settings: {
        uniqueSubmissionKey: emailFieldUuid,
        isClosed: posting.status === "closed" || posting.status === "archived",
      },
    });

    if (!posting.tallyWebhookId) {
      const webhook = await client.createWebhook({
        formId,
        url: config.webhookUrl,
        signingSecret: config.webhookSigningSecret,
      });
      await collection.updateOne(
        { _id: posting._id, organizationId: actor.organizationId },
        { $set: { tallyWebhookId: webhook.id } },
      );
    } else {
      await client.updateWebhook(posting.tallyWebhookId, {
        formId,
        url: config.webhookUrl,
        signingSecret: config.webhookSigningSecret,
      });
    }

    await collection.updateOne(
      { _id: posting._id, organizationId: actor.organizationId },
      { $unset: { tallyFormError: "" } },
    );
    if (isNewForm) {
      await addLog(
        actor.organizationId,
        actor._id,
        "jobPosting.tally.draft",
        posting._id,
        formTitle,
      );
    }
    return { ok: true, formId };
  } catch (error) {
    return recordTallyFormError(posting, actor, error);
  }
}
