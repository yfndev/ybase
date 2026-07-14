import { z } from "zod";
import type {
  ApplicationField,
  ApplicationFieldValue,
} from "../../db/application";
import { JOB_POSTING_HIDDEN_FIELD } from "../../tally/formTemplate";

const fieldSchema = z.object({
  key: z.string(),
  label: z.string().nullish(),
  type: z.string(),
  value: z.unknown(),
});

export const tallyWebhookSchema = z.object({
  eventId: z.string().min(1),
  eventType: z.string(),
  createdAt: z.string().optional(),
  data: z.object({
    responseId: z.string().min(1),
    submissionId: z.string().min(1),
    formId: z.string().min(1),
    createdAt: z.string().optional(),
    fields: z.array(fieldSchema),
  }),
});

export type TallyWebhookPayload = z.infer<typeof tallyWebhookSchema>;
type TallyField = z.infer<typeof fieldSchema>;

export interface ParsedSubmission {
  jobPostingId: string | null;
  email: string | null;
  emailNormalized: string | null;
  name?: string;
  phone?: string;
  fields: ApplicationField[];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toFieldValue(value: unknown): ApplicationFieldValue {
  if (value === null || value === undefined) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? item : JSON.stringify(item),
    );
  }
  return JSON.stringify(value);
}

function isHiddenJobPostingField(field: TallyField): boolean {
  return (
    (field.label ?? "").trim().toLowerCase() ===
    JOB_POSTING_HIDDEN_FIELD.toLowerCase()
  );
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function findByType(
  fields: TallyField[],
  marker: string,
): TallyField | undefined {
  return fields.find((field) => field.type.toUpperCase().includes(marker));
}

function findByLabel(
  fields: TallyField[],
  pattern: RegExp,
): TallyField | undefined {
  return fields.find((field) => field.label && pattern.test(field.label));
}

function extractName(fields: TallyField[]): string | undefined {
  const full = pickString(
    findByLabel(fields, /^\s*(vollständiger name|full ?name|name)\s*$/i)?.value,
  );
  if (full) return full;

  const first = pickString(findByLabel(fields, /vorname|first ?name/i)?.value);
  const last = pickString(
    findByLabel(fields, /nachname|last ?name|surname/i)?.value,
  );
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined.length > 0 ? combined : undefined;
}

export function parseTallySubmission(
  payload: TallyWebhookPayload,
): ParsedSubmission {
  const allFields = payload.data.fields;

  const jobPostingId =
    pickString(allFields.find(isHiddenJobPostingField)?.value) ?? null;
  const email = pickString(findByType(allFields, "EMAIL")?.value) ?? null;
  const phone = pickString(findByType(allFields, "PHONE")?.value);

  const fields: ApplicationField[] = allFields
    .filter((field) => !isHiddenJobPostingField(field))
    .filter((field) => field.type.toUpperCase() !== "HIDDEN_FIELDS")
    .map((field) => ({
      key: field.key,
      label: field.label ?? "",
      type: field.type,
      value: toFieldValue(field.value),
    }));

  return {
    jobPostingId,
    email,
    emailNormalized: email ? normalizeEmail(email) : null,
    name: extractName(allFields),
    phone,
    fields,
  };
}
