"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import {
  reimbursements,
  travelDetails,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { escapeHtml } from "../../email/escape";
import { sendEmail } from "../../email/resend";
import {
  insertReimbursementLink,
  loadPendingSharedLinks,
  type PendingAllowanceLink,
  type PendingReimbursementLink,
} from "./sharingHelpers";
import { createLinkSchema, sendLinkSchema } from "./validators";

export async function createReimbursementLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createLinkSchema.parse(input);

  const reimbursementId = newId();
  await insertReimbursementLink(reimbursementId, user, args);

  return reimbursementId;
}

export async function sendReimbursementLink(
  input: z.input<typeof sendLinkSchema>,
): Promise<void> {
  const user = await requireUser();
  const args = sendLinkSchema.parse(input);
  const typeLabel =
    args.type === "expense" ? "Auslagenerstattung" : "Reisekostenerstattung";

  if (!/^https?:\/\//i.test(args.link)) throw new Error("Invalid link");
  const senderName = escapeHtml(user.firstName ?? "");
  const projectName = escapeHtml(args.projectName);
  const safeLink = escapeHtml(args.link);

  await sendEmail({
    from: "YBase <info@youngfounders.network>",
    to: args.email,
    subject: `${typeLabel} ausfüllen`,
    html: `
        <p>Hallo,</p>
        <p>${senderName} hat dir einen Link zum Ausfüllen der ${typeLabel} für das Projekt "${projectName}" gesendet.</p>
        <p><a href="${safeLink}">Hier klicken zum Ausfüllen</a></p>
        <p>Viele Grüße,<br/>Dein YBase Team</p>
      `,
  });
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
