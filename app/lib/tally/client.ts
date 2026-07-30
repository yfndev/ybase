import { z } from "zod";
import { createTallyRequest, TALLY_API_URL } from "./transport";
import type {
  TallyBlock,
  TallyFolder,
  TallyForm,
  TallyFormSummary,
} from "./types";

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
const formSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  workspaceId: z.string(),
  folderId: z.string().nullable().optional(),
});
const formListSchema = z.object({
  items: z.array(formSummarySchema),
  hasMore: z.boolean().optional().default(false),
});
const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  workspaceId: z.string(),
  parentId: z.string().nullable(),
});
const folderListSchema = z.array(folderSchema);

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

  async function listForms(workspaceId: string): Promise<TallyFormSummary[]> {
    const forms: TallyFormSummary[] = [];
    let page = 1;
    let hasMore = false;
    do {
      const query = new URLSearchParams({
        page: String(page),
        limit: "500",
        workspaceIds: workspaceId,
      });
      const result = formListSchema.parse(
        await request(`/forms?${query.toString()}`),
      );
      forms.push(...result.items);
      hasMore = result.hasMore;
      page += 1;
    } while (hasMore);
    return forms;
  }

  async function listFolders(workspaceId: string): Promise<TallyFolder[]> {
    return folderListSchema.parse(
      await request(`/workspaces/${encodeURIComponent(workspaceId)}/folders`),
    );
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
    listForms,
    listFolders,
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
