import {
  organizations,
  projects,
  receipts,
  reimbursements,
  travelDetails,
} from "../../db/collections";
import { presignDownload, presignUpload } from "../../s3/storage";
import { contextOwnsUpload, registerPendingUpload } from "../uploads/ownership";

export async function requireOpenSharedReimbursement(id: string) {
  const doc = await (await reimbursements()).findOne({ _id: id });
  if (
    !doc?.isSharedLink ||
    (doc.amount !== 0 && doc.status !== "changes_requested")
  ) {
    throw new Error("Invalid link");
  }
  return doc;
}

export async function getPublicReimbursement(id: string) {
  const doc = await (await reimbursements()).findOne({ _id: id });
  if (!doc) return { valid: false as const, error: "Link ungültig" };
  if (!doc.isSharedLink) {
    return { valid: false as const, error: "Kein geteilter Link" };
  }
  const isEditing = doc.status === "changes_requested";
  if (doc.amount > 0 && !isEditing) {
    return { valid: false as const, error: "Bereits eingereicht" };
  }

  const [organization, project, travel, receiptList] = await Promise.all([
    (await organizations()).findOne({ _id: doc.organizationId }),
    (await projects()).findOne({
      _id: doc.projectId,
      organizationId: doc.organizationId,
    }),
    doc.type === "travel"
      ? (await travelDetails()).findOne({ reimbursementId: id })
      : null,
    isEditing ? (await receipts()).find({ reimbursementId: id }).toArray() : [],
  ]);

  return {
    valid: true as const,
    type: doc.type,
    organizationName: organization?.name || "",
    projectName: project?.name || "",
    description: doc.description,
    invitedName: doc.invitedName,
    invitedEmail: doc.invitedEmail,
    travelDetails: travel,
    changesRequested: isEditing ? doc.reviewNote : undefined,
    submission: isEditing
      ? {
          name: doc.submitterName ?? doc.invitedName ?? "",
          email: doc.submitterEmail ?? doc.invitedEmail ?? "",
          iban: doc.iban,
          bic: doc.bic ?? "",
          accountHolder: doc.accountHolder,
          signatureStorageId: doc.signatureStorageId ?? null,
          receipts: receiptList.map(
            ({ _id, _creationTime, reimbursementId, ...receipt }) => receipt,
          ),
        }
      : undefined,
  };
}

export async function createPublicReimbursementUpload(
  id: string,
  contentType?: string,
) {
  const doc = await requireOpenSharedReimbursement(id);
  const upload = await presignUpload(contentType);
  const result = await (
    await reimbursements()
  ).updateOne(
    {
      _id: id,
      isSharedLink: true,
      $or: [
        { submitterName: { $exists: false } },
        { status: "changes_requested" },
      ],
    },
    { $addToSet: { pendingUploadKeys: upload.key } },
  );
  if (result.modifiedCount !== 1) throw new Error("Invalid link");
  await registerPendingUpload(upload.key, {
    organizationId: doc.organizationId,
    userId: doc.createdBy,
    contextType: "reimbursement",
    contextId: id,
  });
  return upload;
}

export async function getPublicReimbursementFileUrl(
  id: string,
  storageKey: string,
): Promise<string> {
  const doc = await requireOpenSharedReimbursement(id);
  const existingReceipt = await (
    await receipts()
  ).findOne({
    reimbursementId: id,
    fileStorageId: storageKey,
  });
  const isAttached =
    Boolean(existingReceipt) || doc.signatureStorageId === storageKey;
  const isPending =
    (doc.pendingUploadKeys ?? []).includes(storageKey) &&
    (await contextOwnsUpload(
      storageKey,
      doc.organizationId,
      "reimbursement",
      id,
    ));
  if (!isAttached && !isPending) throw new Error("Invalid key");
  return presignDownload(storageKey);
}
