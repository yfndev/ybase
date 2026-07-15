import { signatureTokens } from "../../db/collections";
import { presignUpload } from "../../s3/storage";
import {
  claimPendingUploads,
  registerPendingUpload,
} from "../uploads/ownership";

async function requireOpenToken(token: string) {
  const doc = await (await signatureTokens()).findOne({ token });
  if (!doc) throw new Error("Ungültiger Link");
  if (doc.expiresAt < Date.now()) throw new Error("Link abgelaufen");
  if (doc.usedAt) throw new Error("Link bereits verwendet");
  return doc;
}

export async function validatePublicSignToken(token: string) {
  try {
    await requireOpenToken(token);
    return { valid: true as const };
  } catch (error) {
    return {
      valid: false as const,
      error: error instanceof Error ? error.message : "Ungültiger Link",
    };
  }
}

export async function getPublicSignStatus(token: string) {
  const doc = await (await signatureTokens()).findOne({ token });
  if (!doc) return null;
  return {
    signatureStorageId: doc.signatureStorageId ?? null,
    usedAt: doc.usedAt ?? null,
  };
}

export async function createPublicSignatureUpload(
  token: string,
  contentType?: string,
) {
  const doc = await requireOpenToken(token);
  const upload = await presignUpload(contentType);
  const result = await (
    await signatureTokens()
  ).updateOne(
    { token, usedAt: { $exists: false }, expiresAt: { $gt: Date.now() } },
    { $set: { pendingSignatureStorageId: upload.key } },
  );
  if (result.modifiedCount !== 1) throw new Error("Ungültiger Link");
  await registerPendingUpload(upload.key, {
    organizationId: doc.organizationId,
    userId: doc.createdBy,
    contextType: "signatureToken",
    contextId: doc._id,
  });
  return upload;
}

export async function submitPublicSignature(token: string): Promise<void> {
  const doc = await requireOpenToken(token);
  if (!doc.pendingSignatureStorageId) {
    throw new Error("Keine Unterschrift hochgeladen");
  }
  await claimPendingUploads(
    [doc.pendingSignatureStorageId],
    { organizationId: doc.organizationId, userId: doc.createdBy },
    ["signatureToken"],
    { type: "signatureToken", id: doc._id },
    doc._id,
  );
  const now = Date.now();
  const result = await (
    await signatureTokens()
  ).updateOne(
    {
      token,
      usedAt: { $exists: false },
      expiresAt: { $gt: now },
      pendingSignatureStorageId: doc.pendingSignatureStorageId,
    },
    {
      $set: {
        signatureStorageId: doc.pendingSignatureStorageId,
        usedAt: now,
      },
      $unset: { pendingSignatureStorageId: "" },
    },
  );
  if (result.modifiedCount !== 1) throw new Error("Link bereits verwendet");
}
