"use server";

import type { z } from "zod";
import { requirePermission } from "../../auth/session";
import { documentExecutions, documentVersions } from "../../db/collections";
import { newId } from "../../db/ids";
import { DOCUMENT_EXECUTION_TYPE } from "../../members/documents";
import { membershipDocumentDirectory } from "../../s3/keys";
import {
  contentStorageKey,
  normalizeDocumentContent,
  storeDocumentContent,
} from "./documentContent";
import { documentUpdateSchema } from "./documentPublicationSchema";

export async function updateMembershipDocument(
  input: z.input<typeof documentUpdateSchema>,
): Promise<{ id: string; mode: "updated" | "replaced" }> {
  const actor = await requirePermission("manage_members");
  const {
    versionId,
    content: html,
    ...parsed
  } = documentUpdateSchema.parse(input);
  const versions = await documentVersions();
  const source = await versions.findOne({
    _id: versionId,
    organizationId: actor.organizationId,
  });
  if (!source) throw new Error("Dokumentversion nicht gefunden.");
  if (!source.isActive) {
    throw new Error("Nur aktive Unterlagen können bearbeitet werden.");
  }
  if (source.kind !== parsed.kind) {
    throw new Error(
      "Die Dokumentart kann beim Bearbeiten nicht geändert werden.",
    );
  }

  const { content, sha256 } = normalizeDocumentContent(html);
  const assignmentCount = await (
    await documentExecutions()
  ).countDocuments({
    organizationId: actor.organizationId,
    documentVersionId: source._id,
  });
  if (assignmentCount === 0) {
    const storageKey = `${membershipDocumentDirectory(
      actor.organizationId,
      source._id,
    )}/content-${sha256}.html`;
    await storeDocumentContent(storageKey, content);
    const result = await versions.updateOne(
      {
        _id: source._id,
        organizationId: actor.organizationId,
        sha256: source.sha256,
      },
      {
        $set: {
          ...parsed,
          contentStorageKey: storageKey,
          sha256,
          executionType: DOCUMENT_EXECUTION_TYPE[parsed.kind],
        },
      },
    );
    if (result.matchedCount !== 1) {
      throw new Error(
        "Die Unterlage wurde parallel geändert. Bitte lade die Seite neu.",
      );
    }
    return { id: source._id, mode: "updated" };
  }

  if (parsed.versionLabel === source.versionLabel) {
    throw new Error(
      "Für eine bereits zugewiesene Unterlage ist eine neue Versionsnummer erforderlich.",
    );
  }

  const id = newId();
  const now = Date.now();
  const storageKey = contentStorageKey(
    membershipDocumentDirectory(actor.organizationId, id),
  );
  await storeDocumentContent(storageKey, content);
  await versions.insertOne({
    _id: id,
    _creationTime: now,
    organizationId: actor.organizationId,
    ...parsed,
    contentStorageKey: storageKey,
    sha256,
    publishedAt: now,
    publishedBy: actor._id,
    executionType: DOCUMENT_EXECUTION_TYPE[parsed.kind],
    isActive: true,
  });
  await versions.updateOne(
    { _id: source._id, organizationId: actor.organizationId },
    { $set: { isActive: false } },
  );
  return { id, mode: "replaced" };
}
