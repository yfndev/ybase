"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import {
  reimbursements,
  travelDetails,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { requireActiveOrganizationProject } from "../projects/access";
import { sendSubmissionRequestedEmail } from "./email";
import { createLinkSchema } from "./schemas";
import {
  insertReimbursementLink,
  loadPendingSharedLinks,
  type PendingAllowanceLink,
  type PendingReimbursementLink,
} from "./sharingHelpers";

export async function createReimbursementLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireRole("finance");
  const args = createLinkSchema.parse(input);
  await requireActiveOrganizationProject(args.projectId, user.organizationId);

  const reimbursementId = newId();
  await insertReimbursementLink(reimbursementId, user, args);
  if (args.invitedEmail) {
    await sendSubmissionRequestedEmail(reimbursementId);
  }

  return reimbursementId;
}

export async function deleteSharedReimbursementLink(input: {
  id: string;
}): Promise<void> {
  const user = await requireRole("finance");
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await reimbursements()).findOne({ _id: id });

  if (!doc) throw new Error("Not found");
  if (!doc.isSharedLink) throw new Error("Not a shared link");
  if (doc.submittedAt !== undefined)
    throw new Error("Cannot delete submitted reimbursement");
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
  const user = await requireRole("finance");
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
  const user = await requireRole("finance");
  return loadPendingSharedLinks(user.organizationId);
}
