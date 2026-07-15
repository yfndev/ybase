import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
import {
  receipts,
  reimbursements,
  signatureTokens,
  volunteerAllowance,
} from "../../db/collections";
import type { UserRole } from "../../db/types";
import { userOwnsUpload } from "./ownership";

type FileActor = {
  _id: string;
  organizationId: string;
  role: UserRole;
};

function canAccessOwnedDocument(
  actor: FileActor,
  document: { organizationId: string; createdBy: string },
): boolean {
  return (
    document.organizationId === actor.organizationId &&
    (document.createdBy === actor._id ||
      hasPermission(actor.role, USER_PERMISSIONS.finance))
  );
}

export async function requireFileAccess(
  storageKey: string,
  actor: FileActor,
): Promise<void> {
  if (await userOwnsUpload(storageKey, actor.organizationId, actor._id)) {
    return;
  }

  const receipt = await (
    await receipts()
  ).findOne({
    fileStorageId: storageKey,
  });
  if (receipt) {
    const reimbursement = await (
      await reimbursements()
    ).findOne({
      _id: receipt.reimbursementId,
    });
    if (reimbursement && canAccessOwnedDocument(actor, reimbursement)) return;
  }

  const reimbursement = await (
    await reimbursements()
  ).findOne({
    signatureStorageId: storageKey,
  });
  if (reimbursement && canAccessOwnedDocument(actor, reimbursement)) return;

  const allowance = await (
    await volunteerAllowance()
  ).findOne({
    signatureStorageId: storageKey,
  });
  if (allowance && canAccessOwnedDocument(actor, allowance)) return;

  const token = await (
    await signatureTokens()
  ).findOne({
    organizationId: actor.organizationId,
    createdBy: actor._id,
    $or: [
      { signatureStorageId: storageKey },
      { pendingSignatureStorageId: storageKey },
    ],
  });
  if (token) return;

  throw new Error("File not found");
}
