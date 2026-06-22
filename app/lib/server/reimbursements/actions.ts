"use server";

import { z } from "zod";
import { requireRole, requireUser } from "../../auth/session";
import { reimbursements, travelDetails } from "../../db/collections";
import { newId } from "../../db/ids";
import { presignUpload } from "../../s3/storage";
import { getOrganization } from "../organizations/data";
import { addLog } from "../logs";
import { getFileUrl, getReceipts, getReimbursement } from "./data";
import {
  cleanupReimbursement,
  insertReceipts,
  insertReimbursement,
  loadPendingForReview,
} from "./helpers";
import {
  createReimbursementSchema,
  createTravelReimbursementSchema,
} from "./validators";

export async function createReimbursement(
  input: z.input<typeof createReimbursementSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createReimbursementSchema.parse(input);

  const reimbursementId = newId();
  await insertReimbursement(reimbursementId, user, "expense", args);

  await insertReceipts(reimbursementId, args.receipts);

  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.create",
    reimbursementId,
    `${args.amount}€`,
  );

  return reimbursementId;
}

export async function createTravelReimbursement(
  input: z.input<typeof createTravelReimbursementSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createTravelReimbursementSchema.parse(input);

  const reimbursementId = newId();
  await insertReimbursement(reimbursementId, user, "travel", args);

  await (
    await travelDetails()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    reimbursementId,
    startDate: args.startDate,
    endDate: args.endDate,
    destination: args.destination,
    purpose: args.purpose,
    isInternational: args.isInternational,
    mealAllowanceDays: args.mealAllowanceDays,
    mealAllowanceDailyBudget: args.mealAllowanceDailyBudget,
  });

  await insertReceipts(reimbursementId, args.receipts);

  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.create",
    reimbursementId,
    `Travel ${args.amount}€`,
  );

  return reimbursementId;
}

export async function generateUploadUrl(
  contentType?: string,
): Promise<{ key: string; url: string }> {
  await requireUser();
  return presignUpload(contentType);
}

export async function getFileUrlAction(key: string): Promise<string> {
  return getFileUrl(key);
}

export async function getReimbursementPdfData(
  reimbursementId: string,
): Promise<{
  reimbursement: Awaited<ReturnType<typeof getReimbursement>>;
  organization: Awaited<ReturnType<typeof getOrganization>>;
  signatureUrl: string | null;
  receiptsWithUrls: Array<
    Awaited<ReturnType<typeof getReceipts>>[number] & { fileUrl: string }
  >;
} | null> {
  const reimbursement = await getReimbursement(reimbursementId);
  if (!reimbursement) return null;

  const organization = await getOrganization();
  const signatureUrl = reimbursement.signatureStorageId
    ? await getFileUrl(reimbursement.signatureStorageId)
    : null;

  const receipts = await getReceipts(reimbursementId);
  const receiptsWithUrls = await Promise.all(
    receipts.map(async (receipt) => ({
      ...receipt,
      fileUrl: await getFileUrl(receipt.fileStorageId),
    })),
  );

  return { reimbursement, organization, signatureUrl, receiptsWithUrls };
}

export async function deleteReimbursement(input: {
  reimbursementId: string;
}): Promise<void> {
  const user = await requireUser();
  const { reimbursementId } = z
    .object({ reimbursementId: z.string() })
    .parse(input);

  const reimbursement = await (
    await reimbursements()
  ).findOne({
    _id: reimbursementId,
  });

  if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
    throw new Error("Reimbursement not found");
  }

  if (reimbursement.createdBy !== user._id && user.role !== "admin") {
    throw new Error("Only the creator or an admin can delete reimbursements");
  }

  await cleanupReimbursement(reimbursement);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.delete",
    reimbursementId,
    `${reimbursement.amount}€`,
  );
}

export async function approve(input: {
  reimbursementId: string;
}): Promise<void> {
  const user = await requireRole("lead");
  const { reimbursementId } = z
    .object({ reimbursementId: z.string() })
    .parse(input);

  const reimbursement = await loadPendingForReview(
    reimbursementId,
    user.organizationId,
  );

  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "approved",
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
    },
  );
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.approve",
    reimbursementId,
    `${reimbursement.amount}€`,
  );
}

export async function decline(input: {
  reimbursementId: string;
  rejectionNote: string;
}): Promise<void> {
  const user = await requireRole("lead");
  const { reimbursementId, rejectionNote } = z
    .object({ reimbursementId: z.string(), rejectionNote: z.string() })
    .parse(input);

  await loadPendingForReview(reimbursementId, user.organizationId);

  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "declined",
        rejectionNote,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
    },
  );

  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.decline",
    reimbursementId,
    rejectionNote,
  );
}
