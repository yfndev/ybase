import { createHash } from "node:crypto";
import { getObjectBuffer, putObject } from "../../s3/storage";
import { sanitizeRichText } from "../jobPostings/sanitize";

const CONTENT_TYPE = "text/html; charset=utf-8";
const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_BYTES = 400_000;

export function contentStorageKey(directory: string): string {
  return `${directory}/content.html`;
}

export function normalizeDocumentContent(html: string): {
  content: string;
  sha256: string;
} {
  const content = sanitizeRichText(html);
  if (content.length < MIN_CONTENT_LENGTH) {
    throw new Error("Der Dokumententext ist zu kurz.");
  }
  if (Buffer.byteLength(content, "utf8") > MAX_CONTENT_BYTES) {
    throw new Error("Der Dokumententext ist zu lang.");
  }
  return { content, sha256: hashDocumentContent(content) };
}

export function hashDocumentContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export async function storeDocumentContent(
  key: string,
  content: string,
): Promise<void> {
  await putObject(key, Buffer.from(content, "utf8"), CONTENT_TYPE);
}

export async function loadDocumentContent(
  key: string,
  expectedHash: string,
): Promise<string> {
  const content = (await getObjectBuffer(key)).toString("utf8");
  if (hashDocumentContent(content) !== expectedHash) {
    throw new Error("Der gespeicherte Dokumententext wurde verändert.");
  }
  return sanitizeRichText(content);
}
