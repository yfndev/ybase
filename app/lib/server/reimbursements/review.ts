"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { reimbursements } from "../../db/collections";
import { addLog } from "../logs";
import { requirePendingReimbursement } from "./access";
import {
  sendApprovalEmail,
  sendChangesRequestedEmail,
  sendRejectionEmail,
} from "./email";

async function setApproval(reimbursementId: string, reviewerId: string) {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "", rejectionNote: "" },
    },
  );
}

async function setDecline(
  reimbursementId: string,
  reviewerId: string,
  rejectionNote: string,
) {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "declined",
        rejectionNote,
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "" },
    },
  );
}

async function setChangesRequest(
  reimbursementId: string,
  reviewerId: string,
  reviewNote: string,
) {
  await (
    await reimbursements()
  ).updateOne(
    { _id: reimbursementId },
    {
      $set: {
        status: "changes_requested",
        reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: Date.now(),
        isSharedLink: true,
      },
      $unset: { rejectionNote: "" },
    },
  );
}

export async function approve(input: {
  reimbursementId: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { reimbursementId } = z
    .object({ reimbursementId: z.string() })
    .parse(input);
  const reimbursement = await requirePendingReimbursement(
    reimbursementId,
    user.organizationId,
  );

  await setApproval(reimbursementId, user._id);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.approve",
    reimbursementId,
    `${reimbursement.amount}€`,
  );
  await sendApprovalEmail(reimbursementId);
}

export async function decline(input: {
  reimbursementId: string;
  rejectionNote: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { reimbursementId, rejectionNote } = z
    .object({
      reimbursementId: z.string(),
      rejectionNote: z.string().trim().min(1),
    })
    .parse(input);
  await requirePendingReimbursement(reimbursementId, user.organizationId);
  await setDecline(reimbursementId, user._id, rejectionNote);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.decline",
    reimbursementId,
    rejectionNote,
  );
  await sendRejectionEmail(reimbursementId);
}

export async function requestChanges(input: {
  reimbursementId: string;
  reviewNote: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { reimbursementId, reviewNote } = z
    .object({
      reimbursementId: z.string(),
      reviewNote: z.string().trim().min(1),
    })
    .parse(input);
  await requirePendingReimbursement(reimbursementId, user.organizationId);
  await setChangesRequest(reimbursementId, user._id, reviewNote);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.requestChanges",
    reimbursementId,
    reviewNote,
  );
  await sendChangesRequestedEmail(reimbursementId);
}
