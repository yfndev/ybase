import type { ApplicationField, ApplicationFieldValue } from "@/lib/db/types";

export const DATE_TIME_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DATE_FORMAT = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function formatFieldLabel(label: string): string {
  return label
    .replace(
      /&(#\d+|#x[\da-f]+|amp|apos|gt|lt|nbsp|quot);/gi,
      (entity, code: string) => {
        if (code.startsWith("#x")) {
          return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
        }
        if (code.startsWith("#")) {
          return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
        }
        return HTML_ENTITIES[code.toLowerCase()] ?? entity;
      },
    )
    .replace(/\s+/g, " ")
    .replace(/:\s*$/, "")
    .trim();
}

export function formatFieldValue(
  value: ApplicationFieldValue,
  type?: string,
): string {
  if (value === null) return "–";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (typeof value === "string") {
    if (type?.toUpperCase() === "INPUT_DATE") {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (match) {
        return DATE_FORMAT.format(
          new Date(
            Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
          ),
        );
      }
    }
    if (type?.toUpperCase() === "INPUT_TIME") return `${value} Uhr`;
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (type?.toUpperCase() === "RANKING") {
      return (
        value
          .map((item, index) => `${index + 1}. ${formatFieldValue(item)}`)
          .join(" · ") || "–"
      );
    }
    return value.map((item) => formatFieldValue(item)).join(", ") || "–";
  }
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${formatFieldValue(item)}`)
    .join(" · ");
}

export function isApplicantIdentityField(field: ApplicationField): boolean {
  const type = field.type.toUpperCase();
  const label = field.label.trim();
  return (
    type.includes("EMAIL") ||
    type.includes("PHONE") ||
    /^(vollständiger name|full ?name|name|vorname|nachname|vor-?\s*(?:und|&)\s*nachname):?$/i.test(
      label,
    )
  );
}
