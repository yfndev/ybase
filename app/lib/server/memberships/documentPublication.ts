"use server";

import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { documentVersions } from "../../db/collections";
import { newId } from "../../db/ids";
import { membershipDocumentDirectory } from "../../s3/keys";
import { putObject } from "../../s3/storage";

const ALLOWED_SOURCE_HOSTS = new Set([
  "docs.google.com",
  "drive.google.com",
  "googleusercontent.com",
]);

const publicationSchema = z
  .object({
    kind: z.enum([
      "bylaws",
      "code_of_conduct",
      "privacy_notice",
      "usage_rights",
      "optional_consent",
    ]),
    title: z.string().trim().min(2).max(150),
    versionLabel: z.string().trim().min(1).max(50),
    sourceUrl: z.url(),
    targetTeamIds: z.array(z.string().min(1)).default([]),
    targetDepartmentIds: z.array(z.string().min(1)).default([]),
    executionType: z.enum(["signature", "acknowledgement", "optional_consent"]),
  })
  .superRefine((document, context) => {
    const requiredType = {
      bylaws: "acknowledgement",
      code_of_conduct: "signature",
      privacy_notice: "acknowledgement",
      usage_rights: "signature",
      optional_consent: "optional_consent",
    }[document.kind];
    if (document.executionType !== requiredType) {
      context.addIssue({
        code: "custom",
        path: ["executionType"],
        message:
          "Dokumentart und Ausführungsform müssen rechtlich getrennt bleiben.",
      });
    }
  });

export async function publishMembershipDocument(
  input: z.input<typeof publicationSchema>,
) {
  const actor = await requirePermission("manage_members");
  const parsed = publicationSchema.parse(input);
  const bytes = await fetchPdf(parsed.sourceUrl);
  const id = newId();
  const now = Date.now();
  const hash = createHash("sha256").update(bytes).digest("hex");
  const storageKey = `${membershipDocumentDirectory(
    actor.organizationId,
    id,
  )}/snapshot.pdf`;
  await putObject(storageKey, bytes, "application/pdf");
  await (
    await documentVersions()
  ).insertOne({
    _id: id,
    _creationTime: now,
    organizationId: actor.organizationId,
    ...parsed,
    snapshotStorageKey: storageKey,
    sha256: hash,
    publishedAt: now,
    publishedBy: actor._id,
    isActive: true,
  });
  return { id, sha256: hash };
}

export async function listMembershipDocumentVersions() {
  const actor = await requirePermission("manage_members");
  const versions = await (await documentVersions())
    .find({ organizationId: actor.organizationId })
    .sort({ publishedAt: -1 })
    .toArray();
  return versions.map((version) => ({
    id: version._id,
    kind: version.kind,
    title: version.title,
    versionLabel: version.versionLabel,
    sha256: version.sha256,
    sourceUrl: version.sourceUrl,
    executionType: version.executionType,
    targetTeamIds: version.targetTeamIds,
    targetDepartmentIds: version.targetDepartmentIds,
    publishedAt: version.publishedAt,
    isActive: version.isActive,
    snapshotUrl: `/api/membership-documents/${version._id}/download`,
  }));
}

export async function deactivateMembershipDocument(input: {
  versionId: string;
}) {
  const { versionId } = z.object({ versionId: z.string().min(1) }).parse(input);
  const actor = await requirePermission("manage_members");
  const result = await (
    await documentVersions()
  ).updateOne(
    { _id: versionId, organizationId: actor.organizationId },
    { $set: { isActive: false } },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Dokumentversion nicht gefunden.");
  }
}

async function fetchPdf(sourceUrl: string): Promise<Uint8Array> {
  const response = await fetchAllowedSource(
    new URL(sourceUrl),
    ALLOWED_SOURCE_HOSTS,
  );
  if (!response.ok) {
    throw new Error("Die PDF-Fassung konnte nicht geladen werden.");
  }
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > 10_000_000) throw new Error("Die PDF-Fassung ist zu groß.");
  const bytes = await readPdfBytes(response);
  const header = Buffer.from(bytes.subarray(0, 5)).toString();
  if (header !== "%PDF-") {
    throw new Error("Die Dokumentquelle liefert keine gültige PDF-Datei.");
  }
  try {
    await PDFDocument.load(bytes);
  } catch {
    throw new Error("Die Dokumentquelle enthält keine lesbare PDF-Fassung.");
  }
  return bytes;
}

async function readPdfBytes(response: Response): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Die Dokumentquelle liefert keine PDF-Datei.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 10_000_000) {
      await reader.cancel();
      throw new Error("Die PDF-Fassung ist zu groß.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function fetchAllowedSource(
  url: URL,
  allowedHosts: Set<string>,
  redirects = 0,
): Promise<Response> {
  if (
    url.protocol !== "https:" ||
    ![...allowedHosts].some(
      (host) =>
        url.hostname.toLowerCase() === host ||
        url.hostname.toLowerCase().endsWith(`.${host}`),
    )
  ) {
    throw new Error("Die Dokumentquelle ist nicht freigegeben.");
  }
  if (redirects > 3) throw new Error("Zu viele Weiterleitungen.");
  const response = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error("Ungültige Dokumentweiterleitung.");
    return fetchAllowedSource(
      new URL(location, url),
      allowedHosts,
      redirects + 1,
    );
  }
  return response;
}
