import { z } from "zod";
import { createTallyRequest, TALLY_API_URL } from "./transport";
import type { TallyBlock, TallyForm } from "./types";

type FormPatch = Partial<Pick<TallyForm, "blocks" | "settings" | "status">> & {
  name?: string;
};

const blockSchema = z.object({
  uuid: z.string(),
  type: z.string(),
  groupUuid: z.string(),
  groupType: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
});
const formResourceSchema = z.object({
  id: z.string(),
  status: z.string(),
  workspaceId: z.string(),
  blocks: z.array(blockSchema).optional().default([]),
  settings: z.record(z.string(), z.unknown()).optional().default({}),
});
const createdFormSchema = z.object({ id: z.string(), status: z.string() });
const webhookSchema = z.object({ id: z.string() });

export function createTallyClient(
  apiToken: string,
  fetcher: typeof fetch = fetch,
  apiUrl = TALLY_API_URL,
) {
  if (!apiToken) throw new Error("Tally API token is required");

  const request = createTallyRequest(apiToken, fetcher, apiUrl);

  async function getForm(formId: string): Promise<TallyForm> {
    return formResourceSchema.parse(await request(`/forms/${formId}`));
  }

  async function createForm(input: {
    templateId: string;
    workspaceId: string;
    blocks: TallyBlock[];
  }): Promise<{ id: string }> {
    const body = { ...input, status: "DRAFT" };
    return createdFormSchema.parse(
      await request("/forms", { method: "POST", body }),
    );
  }

  async function updateForm(formId: string, patch: FormPatch): Promise<void> {
    await request(`/forms/${formId}`, { method: "PATCH", body: patch });
  }

  async function createWebhook(input: {
    formId: string;
    url: string;
    signingSecret: string;
  }): Promise<{ id: string }> {
    const body = { ...input, eventTypes: ["FORM_RESPONSE"] };
    return webhookSchema.parse(
      await request("/webhooks", { method: "POST", body }),
    );
  }

  async function updateWebhook(
    webhookId: string,
    input: {
      formId: string;
      url: string;
      signingSecret: string;
    },
  ): Promise<void> {
    const body = {
      ...input,
      eventTypes: ["FORM_RESPONSE"],
      isEnabled: true,
    };
    await request(`/webhooks/${webhookId}`, { method: "PATCH", body });
  }

  return {
    getForm,
    createForm,
    updateForm,
    publishForm: (formId: string) =>
      updateForm(formId, { status: "PUBLISHED" }),
    createWebhook,
    updateWebhook,
    deleteForm: (formId: string) =>
      request(`/forms/${formId}`, { method: "DELETE" }, true).then(
        () => undefined,
      ),
    deleteWebhook: (webhookId: string) =>
      request(`/webhooks/${webhookId}`, { method: "DELETE" }, true).then(
        () => undefined,
      ),
  };
}
