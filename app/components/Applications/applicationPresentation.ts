import type { ApplicationField, ApplicationFieldValue } from "@/lib/db/types";

export const DATE_TIME_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatFieldValue(value: ApplicationFieldValue): string {
  if (value === null) return "–";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(formatFieldValue).join(", ") || "–";
  }
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${formatFieldValue(item)}`)
    .join(" · ");
}

export function isStandardField(field: ApplicationField): boolean {
  const type = field.type.toUpperCase();
  const label = field.label.trim();
  return (
    type.includes("EMAIL") ||
    type.includes("PHONE") ||
    /^(vollständiger name|full ?name|name|vorname|nachname)$/i.test(label)
  );
}
