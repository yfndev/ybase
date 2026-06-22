import { shortReferenceId } from "./referenceId";

// Finom: max 100 chars, restricted charset
const MAX_LENGTH = 100;
const DISALLOWED = /[^A-Za-z0-9 /\-?:().,+]/g;

const UMLAUTS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  ß: "ss",
};

type Context = {
  reimbursementId: string;
  projectName?: string;
  name?: string;
};

export function buildPaymentReference(context: Context): string {
  const reference = shortReferenceId(context.reimbursementId);
  const parts = ["Erstattung", reference, context.projectName, context.name];
  const text = parts.filter(Boolean).join(" ");
  return sanitize(text)
    .slice(0, MAX_LENGTH)
    .replace(/[\s/]+$/, "");
}

function sanitize(text: string): string {
  const transliterated = text.replace(/[äöüÄÖÜß]/g, (char) => UMLAUTS[char]);
  const allowed = transliterated.replace(DISALLOWED, " ");
  const collapsed = allowed.replace(/\s+/g, " ").replace(/\/{2,}/g, "/");
  return collapsed.replace(/^[\s/\-:()]+/, "").trimEnd();
}
