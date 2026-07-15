"use server";

import type { z } from "zod";
import { requireUser } from "../../auth/session";
import { receipts, reimbursements, travelDetails } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Receipt, Reimbursement } from "../../db/types";
import { addLog } from "../logs";
import { requireActiveOrganizationProject } from "../projects/access";
import { claimPendingUploads } from "../uploads/ownership";
import { sendSubmissionReceivedEmail } from "./email";
import {
  createReimbursementSchema,
  createTravelReimbursementSchema,
} from "./schemas";

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

async function insertReimbursement(
  reimbursementId: string,
  user: ReimbursementActor,
  type: Reimbursement["type"],
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

async function insertReceipts(
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

async function insertTravelDetails(
  reimbursementId: string,
  args: z.infer<typeof createTravelReimbursementSchema>,
): Promise<void> {
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
}

async function claimSubmissionUploads(
  reimbursementId: string,
  user: ReimbursementActor,
  signatureStorageId: string,
  receiptList: ReceiptInsert[],
): Promise<void> {
  await claimPendingUploads(
    [
      signatureStorageId,
      ...receiptList.map((receipt) => receipt.fileStorageId),
    ],
    { organizationId: user.organizationId, userId: user._id },
    ["user", "signatureToken"],
    { type: "reimbursement", id: reimbursementId },
  );
}

export async function createReimbursement(
  input: z.input<typeof createReimbursementSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createReimbursementSchema.parse(input);
  await requireActiveOrganizationProject(args.projectId, user.organizationId);

  const reimbursementId = newId();
  await claimSubmissionUploads(
    reimbursementId,
    user,
    args.signatureStorageId,
    args.receipts,
  );
  await insertReimbursement(reimbursementId, user, "expense", args);
  await insertReceipts(reimbursementId, args.receipts);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.create",
    reimbursementId,
    `${args.amount}€`,
  );
  await sendSubmissionReceivedEmail(reimbursementId);
  return reimbursementId;
}

export async function createTravelReimbursement(
  input: z.input<typeof createTravelReimbursementSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createTravelReimbursementSchema.parse(input);
  await requireActiveOrganizationProject(args.projectId, user.organizationId);

  const reimbursementId = newId();
  await claimSubmissionUploads(
    reimbursementId,
    user,
    args.signatureStorageId,
    args.receipts,
  );
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
  await sendSubmissionReceivedEmail(reimbursementId);
  return reimbursementId;
}
