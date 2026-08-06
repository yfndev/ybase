"use server";

import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { documentVersions } from "../../db/collections";
import { newId } from "../../db/ids";
import { DOCUMENT_EXECUTION_TYPE } from "../../members/documents";
import { membershipDocumentDirectory } from "../../s3/keys";
import {
  contentStorageKey,
  loadDocumentContent,
  normalizeDocumentContent,
  storeDocumentContent,
} from "./documentContent";

const publicationSchema = z
  .object({
    kind: z.enum([
      "bylaws",
      "privacy_notice",
      "usage_rights",
      "optional_consent",
    ]),
    title: z.string().trim().min(2).max(150),
    versionLabel: z.string().trim().min(1).max(50),
    content: z.string().min(1),
    targetTeamIds: z.array(z.string().min(1)).default([]),
    targetDepartmentIds: z.array(z.string().min(1)).default([]),
  })
  .superRefine((document, context) => {
    if (
      document.kind === "usage_rights" &&
      document.targetTeamIds.length === 0 &&
      document.targetDepartmentIds.length === 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["targetDepartmentIds"],
        message:
          "Die Sondervereinbarung braucht mindestens ein Ziel-Department oder Team.",
      });
    }
  });

export async function publishMembershipDocument(
  input: z.input<typeof publicationSchema>,
) {
  const actor = await requirePermission("manage_members");
  const { content: html, ...parsed } = publicationSchema.parse(input);
  const { content, sha256 } = normalizeDocumentContent(html);
  const id = newId();
  const now = Date.now();
  const storageKey = contentStorageKey(
    membershipDocumentDirectory(actor.organizationId, id),
  );
  await storeDocumentContent(storageKey, content);
  await (
    await documentVersions()
  ).insertOne({
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
  return { id, sha256 };
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
    executionType: version.executionType,
    targetTeamIds: version.targetTeamIds,
    targetDepartmentIds: version.targetDepartmentIds,
    publishedAt: version.publishedAt,
    isActive: version.isActive,
  }));
}

export async function getMembershipDocumentContent(input: {
  versionId: string;
}): Promise<{ title: string; versionLabel: string; content: string }> {
  const { versionId } = z.object({ versionId: z.string().min(1) }).parse(input);
  const actor = await requirePermission("manage_members");
  const version = await (
    await documentVersions()
  ).findOne({ _id: versionId, organizationId: actor.organizationId });
  if (!version) throw new Error("Dokumentversion nicht gefunden.");
  return {
    title: version.title,
    versionLabel: version.versionLabel,
    content: await loadDocumentContent(
      version.contentStorageKey,
      version.sha256,
    ),
  };
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

export type MembershipDocumentVersionSummary = Awaited<
  ReturnType<typeof listMembershipDocumentVersions>
>[number];
