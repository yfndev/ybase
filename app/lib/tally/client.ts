import { z } from "zod";
import { TALLY_API_VERSION } from "./constants";
import type {
  TallyBlock,
  TallyForm,
  TallyFormSummary,
  TallyQuestion,
  TallyResources,
  TallyWorkspace,
} from "./types";

type FormPatch = {
  blocks?: TallyBlock[];
  settings?: Record<string, unknown>;
  status?: string;
};

const TALLY_API_URL = "https://api.tally.so";
const MAX_PAGES = 50;
const itemSchema = z.object({ id: z.string(), name: z.string() });
const formSchema = itemSchema.extend({
  workspaceId: z.string(),
  status: z.string(),
});
const formDetailsSchema = formSchema.extend({
  blocks: z
    .array(
      z.object({
        type: z.string(),
        payload: z.record(z.string(), z.unknown()).optional().default({}),
      }),
    )
    .optional()
    .default([]),
});
const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), hasMore: z.boolean() });
const questionSchema = z.object({
  id: z.string(),
  title: z.string().optional().default(""),
  type: z.string(),
  isDeleted: z.boolean().optional().default(false),
  fields: z
    .array(z.object({ type: z.string(), title: z.string().optional() }))
    .optional()
    .default([]),
});
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
function isAnswerField(type: string): boolean {
  return ![
    "FORM_TITLE",
    "TITLE",
    "TEXT",
    "LABEL",
    "HEADING_1",
    "HEADING_2",
    "HEADING_3",
  ].includes(type);
}

export function createTallyClient(
  apiToken: string,
  fetcher: typeof fetch = fetch,
  apiUrl = TALLY_API_URL,
) {
  if (!apiToken) throw new Error("Tally API token is required");

  async function request(
    path: string,
    init?: { method: string; body: unknown },
  ): Promise<unknown> {
    const response = await fetcher(`${apiUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
        "tally-version": TALLY_API_VERSION,
        ...(init ? { "Content-Type": "application/json" } : {}),
      },
      body: init ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Tally API request failed (${response.status})`);
    }
    if (response.status === 204) return {};
    return response.json();
  }

  async function listPages<T>(
    path: string,
    schema: z.ZodType<{ items: T[]; hasMore: boolean }>,
  ): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const separator = path.includes("?") ? "&" : "?";
      const result = schema.parse(
        await request(`${path}${separator}page=${page}`),
      );
      items.push(...result.items);
      if (!result.hasMore) return items;
    }
    throw new Error("Tally API pagination limit exceeded");
  }

  async function resources(): Promise<TallyResources> {
    const [workspaces, forms] = await Promise.all([
      listPages<TallyWorkspace>("/workspaces", pageSchema(itemSchema)),
      listPages<TallyFormSummary>("/forms?limit=500", pageSchema(formSchema)),
    ]);
    return { workspaces, forms };
  }

  async function questions(
    workspaceId: string,
    formId: string,
  ): Promise<TallyQuestion[]> {
    const form = formDetailsSchema.parse(await request(`/forms/${formId}`));
    if (form.workspaceId !== workspaceId) {
      throw new Error("The selected form does not belong to this workspace");
    }
    const requiresPhone = form.blocks.some(
      (block) =>
        block.type.includes("PHONE") && block.payload.isRequired === true,
    );
    if (requiresPhone) {
      throw new Error("The selected form requires a phone number");
    }
    const result = z
      .object({ questions: z.array(questionSchema) })
      .parse(await request(`/forms/${formId}/questions`));
    return result.questions.flatMap((question) => {
      const type = question.fields[0]?.type ?? question.type;
      const isPhone = [
        question.type,
        ...question.fields.map((f) => f.type),
      ].some((fieldType) => fieldType.includes("PHONE"));
      if (question.isDeleted || isPhone || !isAnswerField(type)) return [];
      return [{ id: question.id, title: question.title || "Ohne Titel", type }];
    });
  }

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

  return {
    resources,
    questions,
    getForm,
    createForm,
    updateForm,
    publishForm: (formId: string) =>
      updateForm(formId, { status: "PUBLISHED" }),
    createWebhook,
  };
}
