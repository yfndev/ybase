"use server";

import { z } from "zod";
import { requireRole, requireUser } from "../../auth/session";
import { newId } from "../../db/ids";
import { presignUpload } from "../../s3/storage";
import { addLog } from "../logs";
import { getFileUrl } from "./data";
import {
  applyApproval,
  applyDecline,
  buildReimbursementPdfData,
  deleteReimbursementById,
  insertTravelDetails,
  type ReimbursementPdfData,
} from "./actionsHelpers";
import {
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

  await insertTravelDetails(reimbursementId, args);

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
): Promise<ReimbursementPdfData | null> {
  return buildReimbursementPdfData(reimbursementId);
}

export async function deleteReimbursement(input: {
  reimbursementId: string;
}): Promise<void> {
  const user = await requireUser();
  const { reimbursementId } = z
    .object({ reimbursementId: z.string() })
    .parse(input);

  await deleteReimbursementById(reimbursementId, user);
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

  await applyApproval(reimbursementId, user._id);
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

  await applyDecline(reimbursementId, user._id, rejectionNote);

  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.decline",
    reimbursementId,
    rejectionNote,
  );
}
