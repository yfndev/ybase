"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "../../volunteerAllowance/constants";
import { addLog } from "../logs";
import {
  sendApprovalEmail,
  sendChangesRequestedEmail,
  sendRejectionEmail,
} from "./email";

async function loadPending(id: string, organizationId: string) {
  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== organizationId) {
    throw new Error("Not found");
  }
  if (doc.status !== "pending") throw new Error("Already processed");
  return doc;
}

export async function approve(input: { id: string }): Promise<void> {
  const user = await requireRole("finance");
  const { id } = z.object({ id: z.string() }).parse(input);
  const doc = await loadPending(id, user.organizationId);

  if (doc.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) {
    throw new Error(
      `Cannot approve: amount exceeds ${MAX_VOLUNTEER_ALLOWANCE_EUR}€ legal limit`,
    );
  }

  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    {
      $set: {
        status: "approved",
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "", rejectionNote: "" },
    },
  );
  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.approve",
    id,
    `${doc.amount}€`,
  );
  await sendApprovalEmail(id);
}

export async function decline(input: {
  id: string;
  rejectionNote: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { id, rejectionNote } = z
    .object({ id: z.string(), rejectionNote: z.string().trim().min(1) })
    .parse(input);
  await loadPending(id, user.organizationId);

  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    {
      $set: {
        status: "declined",
        rejectionNote,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
      },
      $unset: { reviewNote: "" },
    },
  );
  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.decline",
    id,
    rejectionNote,
  );
  await sendRejectionEmail(id);
}

export async function requestChanges(input: {
  id: string;
  reviewNote: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { id, reviewNote } = z
    .object({ id: z.string(), reviewNote: z.string().trim().min(1) })
    .parse(input);
  await loadPending(id, user.organizationId);

  await (
    await volunteerAllowance()
  ).updateOne(
    { _id: id },
    {
      $set: {
        status: "changes_requested",
        reviewNote,
        reviewedBy: user._id,
        reviewedAt: Date.now(),
        isSharedLink: true,
      },
      $unset: { rejectionNote: "" },
    },
  );
  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.requestChanges",
    id,
    reviewNote,
  );
  await sendChangesRequestedEmail(id);
}
