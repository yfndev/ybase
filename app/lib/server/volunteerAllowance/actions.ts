"use server";

import { z } from "zod";
import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
import { requireUser } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { newId } from "../../db/ids";
import { deleteObject } from "../../s3/storage";
import { volunteerAllowanceFields } from "../../volunteerAllowance/schemas";
import { addLog } from "../logs";
import { requireActiveOrganizationProject } from "../projects/access";
import { claimPendingUploads } from "../uploads/ownership";
import { getSignatureUrl } from "./data";
import { sendSubmissionReceivedEmail } from "./email";

export async function create(input: {
  projectId: string;
  amount: number;
  iban: string;
  bic?: string;
  accountHolder: string;
  activityDescription: string;
  startDate: string;
  endDate: string;
  taxYear?: string;
  volunteerName: string;
  volunteerStreet: string;
  volunteerPlz: string;
  volunteerCity: string;
  signatureStorageId: string;
}): Promise<string> {
  const user = await requireUser();
  const args = z
    .object({
      projectId: z.string(),
      ...volunteerAllowanceFields,
    })
    .parse(input);

  await requireActiveOrganizationProject(args.projectId, user.organizationId);

  const _id = newId();
  await claimPendingUploads(
    [args.signatureStorageId],
    { organizationId: user.organizationId, userId: user._id },
    ["user", "signatureToken"],
    { type: "allowance", id: _id },
  );
  await (
    await volunteerAllowance()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    projectId: args.projectId,
    amount: args.amount,
    status: "pending",
    iban: args.iban,
    bic: args.bic,
    accountHolder: args.accountHolder,
    createdBy: user._id,
    activityDescription: args.activityDescription,
    startDate: args.startDate,
    endDate: args.endDate,
    taxYear: args.taxYear,
    volunteerName: args.volunteerName,
    volunteerStreet: args.volunteerStreet,
    volunteerPlz: args.volunteerPlz,
    volunteerCity: args.volunteerCity,
    signatureStorageId: args.signatureStorageId,
    submitterEmail: user.email,
  });

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.create",
    _id,
    `${args.amount}€`,
  );
  await sendSubmissionReceivedEmail(_id);
  return _id;
}

export async function getSignatureUrlAction(key: string): Promise<string> {
  return getSignatureUrl(key);
}

export async function remove(input: { id: string }): Promise<void> {
  const user = await requireUser();
  const { id } = z.object({ id: z.string() }).parse(input);

  const doc = await (await volunteerAllowance()).findOne({ _id: id });
  if (!doc || doc.organizationId !== user.organizationId) {
    throw new Error("Not found");
  }
  const canManageReimbursements = hasPermission(
    user.role,
    USER_PERMISSIONS.finance,
  );
  if (doc.createdBy !== user._id && !canManageReimbursements) {
    throw new Error("Only the creator or finance can delete");
  }

  if (doc.signatureStorageId) {
    await deleteObject(doc.signatureStorageId);
  }

  await (await volunteerAllowance()).deleteOne({ _id: id });

  await addLog(
    user.organizationId,
    user._id,
    "volunteerAllowance.delete",
    id,
    `${doc.amount}€`,
  );
}
