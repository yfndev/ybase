import type { ApplicationFile } from "../../db/types";
import {
  ALLOWED_APPLICATION_FILE_TYPES,
  APPLICATION_FILE_MAX_BYTES,
  contentTypesMatch,
  detectApplicationFileType,
  normalizeContentType,
} from "./fileValidation";

const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 3;
const ALLOWED_SOURCE_HOSTS = new Set([
  "storage.tally.so",
  "storage.googleapis.com",
]);

export class RejectedFileError extends Error {}

function assertAllowedSource(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new RejectedFileError("Die Datei-URL ist ungültig.");
  }
  if (url.protocol !== "https:" || !ALLOWED_SOURCE_HOSTS.has(url.hostname)) {
    throw new RejectedFileError("Die Datei-Quelle ist nicht erlaubt.");
  }
  return url;
}

async function fetchWithSafeRedirects(
  initialUrl: string,
  fetcher: typeof fetch,
): Promise<Response> {
  let url = assertAllowedSource(initialUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetcher(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (response.status < 300 || response.status >= 400) return response;
    const location = response.headers.get("location");
    if (!location || redirect === MAX_REDIRECTS) {
      throw new Error("Download fehlgeschlagen.");
    }
    url = assertAllowedSource(new URL(location, url).toString());
  }
  throw new Error("Download fehlgeschlagen.");
}

async function readLimitedBody(response: Response): Promise<Uint8Array> {
  if (!response.body) throw new Error("Download fehlgeschlagen.");
  const limit = APPLICATION_FILE_MAX_BYTES;
  const chunks: Uint8Array[] = [];
  let length = 0;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        throw new RejectedFileError("Die Datei ist zu groß.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function assertDeclaredFile(file: ApplicationFile): string {
  const contentType = normalizeContentType(file.mimeType);
  if (!ALLOWED_APPLICATION_FILE_TYPES.has(contentType)) {
    throw new RejectedFileError("Dieser Dateityp ist nicht erlaubt.");
  }
  if (file.size > APPLICATION_FILE_MAX_BYTES) {
    throw new RejectedFileError("Die Datei ist zu groß.");
  }
  assertAllowedSource(file.sourceUrl);
  return contentType;
}

export async function downloadApplicationFile(
  file: ApplicationFile,
  fetcher: typeof fetch,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const declaredType = assertDeclaredFile(file);
  const response = await fetchWithSafeRedirects(file.sourceUrl, fetcher);
  if (!response.ok) throw new Error("Download fehlgeschlagen.");

  const contentLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > APPLICATION_FILE_MAX_BYTES
  ) {
    throw new RejectedFileError("Die Datei ist zu groß.");
  }
  const responseType = normalizeContentType(
    response.headers.get("content-type") ?? "",
  );
  if (
    responseType &&
    responseType !== "application/octet-stream" &&
    (!ALLOWED_APPLICATION_FILE_TYPES.has(responseType) ||
      !contentTypesMatch(responseType, declaredType))
  ) {
    throw new RejectedFileError("Der Dateityp stimmt nicht überein.");
  }

  const bytes = await readLimitedBody(response);
  const detectedType = detectApplicationFileType(bytes);
  if (!detectedType || !contentTypesMatch(detectedType, declaredType)) {
    throw new RejectedFileError("Der Dateiinhalt ist nicht erlaubt.");
  }
  return { bytes, contentType: detectedType };
}
