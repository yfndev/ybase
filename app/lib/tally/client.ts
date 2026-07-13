import { z } from "zod";
import { TALLY_API_VERSION } from "./constants";
import type {
  TallyFormSummary,
  TallyQuestion,
  TallyResources,
  TallyWorkspace,
} from "./types";

const API_URL = "https://api.tally.so";
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
) {
  if (!apiToken) throw new Error("Tally API token is required");

  async function request(path: string): Promise<unknown> {
    const response = await fetcher(`${API_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
        "tally-version": TALLY_API_VERSION,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Tally API request failed (${response.status})`);
    }
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

  return { resources, questions };
}
