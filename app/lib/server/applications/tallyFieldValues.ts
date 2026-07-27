import type { ApplicationFieldValue } from "../../db/application";
import type { ParsedApplicationFile } from "./tallyFiles";

interface TallyOption {
  id: string;
  text: string;
}

export interface NormalizableTallyField {
  key: string;
  type: string;
  value: unknown;
  options?: TallyOption[];
  rows?: TallyOption[];
  columns?: TallyOption[];
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
  if (Array.isArray(value)) return value.map(toFieldValue);
  if (typeof value === "object") {
    const snapshot: { [key: string]: ApplicationFieldValue } = {};
    for (const [key, item] of Object.entries(value)) {
      snapshot[key] = toFieldValue(item);
    }
    return snapshot;
  }
  return String(value);
}

function labelById(id: string, options: TallyOption[] | undefined): string {
  return options?.find((option) => option.id === id)?.text ?? id;
}

function resolveOptionValue(
  value: unknown,
  options: TallyOption[] | undefined,
): ApplicationFieldValue {
  if (typeof value === "string") return labelById(value, options);
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? labelById(item, options) : toFieldValue(item),
    );
  }
  return toFieldValue(value);
}

function resolveMatrixValue(
  field: NormalizableTallyField,
): ApplicationFieldValue {
  if (
    typeof field.value !== "object" ||
    field.value === null ||
    Array.isArray(field.value)
  ) {
    return toFieldValue(field.value);
  }

  const resolved: { [key: string]: ApplicationFieldValue } = {};
  for (const [rowId, columns] of Object.entries(field.value)) {
    resolved[labelById(rowId, field.rows)] = resolveOptionValue(
      columns,
      field.columns,
    );
  }
  return resolved;
}

export function normalizeTallyFieldValue(
  field: NormalizableTallyField,
  files: ParsedApplicationFile[],
): ApplicationFieldValue {
  const type = field.type.toUpperCase();
  if (type === "FILE_UPLOAD") {
    return files
      .filter((file) => file.fieldKey === field.key)
      .map((file) => file.fileName);
  }
  if (type === "SIGNATURE") {
    return Array.isArray(field.value) && field.value.length > 0
      ? "Vorhanden"
      : null;
  }
  if (
    type === "MULTIPLE_CHOICE" ||
    type === "CHECKBOXES" ||
    type === "DROPDOWN" ||
    type === "MULTI_SELECT" ||
    type === "RANKING"
  ) {
    return resolveOptionValue(field.value, field.options);
  }
  if (type === "MATRIX") return resolveMatrixValue(field);
  return toFieldValue(field.value);
}

export function tallyCheckboxOptionKeys(
  fields: NormalizableTallyField[],
): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    if (
      field.type.toUpperCase() !== "CHECKBOXES" ||
      !Array.isArray(field.options)
    ) {
      continue;
    }
    for (const option of field.options) {
      keys.add(`${field.key}_${option.id}`);
    }
  }
  return keys;
}
