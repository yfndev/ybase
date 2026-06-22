"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { newId } from "../../db/ids";
import { escapeHtml } from "../../email/escape";
import { sendEmail } from "../../email/resend";

const createLinkSchema = z.object({
  projectId: z.string(),
  activityDescription: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function createLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireUser();
  const args = createLinkSchema.parse(input);

  const id = newId();
  await (
    await volunteerAllowance()
  ).insertOne({
    _id: id,
    _creationTime: Date.now(),
    organizationId: user.organizationId,
    projectId: args.projectId,
    amount: 0,
    status: "pending",
    iban: "",
    bic: "",
    accountHolder: "",
    createdBy: user._id,
    activityDescription: args.activityDescription || "",
    startDate: args.startDate || "",
    endDate: args.endDate || "",
    volunteerName: "",
    volunteerStreet: "",
    volunteerPlz: "",
    volunteerCity: "",
  });

  return id;
}

const sendLinkSchema = z.object({
  email: z.string(),
  link: z.string(),
  projectName: z.string(),
});

export async function sendAllowanceLink(
  input: z.input<typeof sendLinkSchema>,
): Promise<void> {
  const user = await requireUser();
  const args = sendLinkSchema.parse(input);

  if (!/^https?:\/\//i.test(args.link)) throw new Error("Invalid link");
  const senderName = escapeHtml(user.firstName ?? "");
  const projectName = escapeHtml(args.projectName);
  const safeLink = escapeHtml(args.link);

  await sendEmail({
    from: "YBase <info@youngfounders.network>",
    to: args.email,
    subject: "Ehrenamtspauschale ausfüllen",
    html: `
        <p>Hallo,</p>
        <p>${senderName} hat dir einen Link zum Ausfüllen der Ehrenamtspauschale für das Projekt "${projectName}" gesendet.</p>
        <p><a href="${safeLink}">Hier klicken zum Ausfüllen</a></p>
        <p>Viele Grüße,<br/>Dein YBase Team</p>
      `,
  });
}
