"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import {
  reimbursements,
  travelDetails,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import {
  insertReimbursementLink,
  loadPendingSharedLinks,
  type PendingAllowanceLink,
  type PendingReimbursementLink,
} from "./sharingHelpers";
import { createLinkSchema } from "./validators";

export async function createReimbursementLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createLinkSchema.parse(input);

  const reimbursementId = newId();
  await insertReimbursementLink(reimbursementId, user, args);

  return reimbursementId;
}

export async function deleteSharedReimbursementLink(input: {
  id: string;
}): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await reimbursements()).findOne({ _id: id });

  if (!doc) throw new Error("Not found");
  if (!doc.isSharedLink) throw new Error("Not a shared link");
  if (doc.amount > 0) throw new Error("Cannot delete submitted reimbursement");
  if (doc.organizationId !== user.organizationId)
    throw new Error("Unauthorized");

  if (doc.type === "travel") {
    await (await travelDetails()).deleteOne({ reimbursementId: id });
  }

  await (await reimbursements()).deleteOne({ _id: id });
}

export async function deleteSharedAllowanceLink(input: {
  id: string;
}): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });

  if (!doc) throw new Error("Not found");
  if (doc.signatureStorageId || doc.volunteerName)
    throw new Error("Cannot delete submitted allowance");
  if (doc.organizationId !== user.organizationId)
    throw new Error("Unauthorized");

  await (await volunteerAllowance()).deleteOne({ _id: id });
}

export async function getPendingSharedLinks(): Promise<{
  reimbursementLinks: PendingReimbursementLink[];
  allowanceLinks: PendingAllowanceLink[];
}> {
  const user = await requireUser();
  return loadPendingSharedLinks(user.organizationId);
}
