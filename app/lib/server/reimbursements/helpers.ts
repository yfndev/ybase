import { receipts, reimbursements, travelDetails } from "../../db/collections";
import type { Receipt, Reimbursement } from "../../db/types";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";

type ReimbursementType = Reimbursement["type"];

type ReimbursementActor = {
  _id: string;
  organizationId: string;
  name?: string;
  email?: string;
};

type ReimbursementInsert = {
  projectId: string;
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  currency?: string;
  signatureStorageId: string;
};

type ReceiptInsert = Omit<Receipt, "_id" | "_creationTime" | "reimbursementId">;

export async function insertReimbursement(
  reimbursementId: string,
  user: ReimbursementActor,
  type: ReimbursementType,
  args: ReimbursementInsert,
): Promise<void> {
  await (
    await reimbursements()
  ).insertOne({
    _id: reimbursementId,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    projectId: args.projectId,
    amount: args.amount,
    type,
    status: "pending",
    iban: args.iban,
    bic: args.bic,
    accountHolder: args.accountHolder,
    currency: args.currency,
    signatureStorageId: args.signatureStorageId,
    createdBy: user._id,
    submitterName: user.name,
    submitterEmail: user.email,
  });
}

export async function insertReceipts(
  reimbursementId: string,
  receiptList: ReceiptInsert[],
): Promise<void> {
  for (const receipt of receiptList) {
    await (
      await receipts()
    ).insertOne({
      _id: newId(),
      _creationTime: Date.now(),
      reimbursementId,
      ...receipt,
    });
  }
}

export async function loadPendingForReview(
  reimbursementId: string,
  organizationId: string,
): Promise<Reimbursement> {
  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
  });

  if (!reimbursement || reimbursement.organizationId !== organizationId) {
    throw new Error("Reimbursement not found");
  }

  if (reimbursement.status !== "pending") {
    throw new Error("Reimbursement already processed");
  }

  return reimbursement;
}

export async function cleanupReimbursement(
  reimbursement: Reimbursement,
): Promise<void> {
  const reimbursementId = reimbursement._id;

  const receiptList = await (await receipts())
    .find({ reimbursementId })
    .toArray();

  for (const receipt of receiptList) {
    await deleteObject(receipt.fileStorageId);
    await (await receipts()).deleteOne({ _id: receipt._id });
  }

  if (reimbursement.type === "travel") {
    await (await travelDetails()).deleteOne({ reimbursementId });
  }

  if (reimbursement.signatureStorageId) {
    await deleteObject(reimbursement.signatureStorageId);
  }

  await (await reimbursements()).deleteOne({ _id: reimbursementId });
}
