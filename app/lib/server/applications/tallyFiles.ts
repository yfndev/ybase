import { z } from "zod";

const fileValueSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().finite().nonnegative(),
});

interface TallyFileField {
  key: string;
  label?: string | null;
  type: string;
  value: unknown;
}

export interface ParsedApplicationFile {
  fieldKey: string;
  fieldLabel: string;
  sourceId?: string;
  sourceUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  validationError?: string;
}

function malformedFile(
  field: TallyFileField,
  value?: unknown,
): ParsedApplicationFile {
  const partial =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  return {
    fieldKey: field.key,
    fieldLabel: field.label ?? "Datei",
    sourceId: typeof partial.id === "string" ? partial.id : undefined,
    sourceUrl: typeof partial.url === "string" ? partial.url : "",
    fileName:
      typeof partial.name === "string" && partial.name.length > 0
        ? partial.name
        : "Unbekannte Datei",
    mimeType: typeof partial.mimeType === "string" ? partial.mimeType : "",
    size:
      typeof partial.size === "number" && partial.size >= 0 ? partial.size : 0,
    validationError: "Ungültige Dateimetadaten.",
  };
}

export function extractFiles(
  fields: TallyFileField[],
): ParsedApplicationFile[] {
  const files: ParsedApplicationFile[] = [];
  for (const field of fields) {
    if (field.type.toUpperCase() !== "FILE_UPLOAD") continue;
    if (!Array.isArray(field.value)) {
      files.push(malformedFile(field));
      continue;
    }

    for (const value of field.value) {
      const parsed = fileValueSchema.safeParse(value);
      if (!parsed.success) {
        files.push(malformedFile(field, value));
        continue;
      }
      files.push({
        fieldKey: field.key,
        fieldLabel: field.label ?? "Datei",
        sourceId: parsed.data.id,
        sourceUrl: parsed.data.url,
        fileName: parsed.data.name,
        mimeType: parsed.data.mimeType,
        size: parsed.data.size,
      });
    }
  }
  return files;
}
