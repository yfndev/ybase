"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { receipts, reimbursements, travelDetails } from "../../db/collections";
import type { Reimbursement } from "../../db/types";
import { deleteObject } from "../../s3/storage";
import { addLog } from "../logs";
import { requireAccessibleReimbursement } from "./access";

async function cleanupReimbursement(reimbursement: Reimbursement) {
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

export async function deleteReimbursement(input: {
  reimbursementId: string;
}): Promise<void> {
  const user = await requireUser();
  const { reimbursementId } = z
    .object({ reimbursementId: z.string() })
    .parse(input);
  const reimbursement = await requireAccessibleReimbursement(
    reimbursementId,
    user,
  );

  await cleanupReimbursement(reimbursement);
  await addLog(
    user.organizationId,
    user._id,
    "reimbursement.delete",
    reimbursementId,
    `${reimbursement.amount}€`,
  );
}
