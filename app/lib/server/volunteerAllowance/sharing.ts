"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { newId } from "../../db/ids";
import { sendSubmissionRequestedEmail } from "./email";

const createLinkSchema = z.object({
  projectId: z.string(),
  activityDescription: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  invitedName: z.string().trim().optional(),
  invitedEmail: z.string().email().optional(),
});

export async function createLink(
  input: z.input<typeof createLinkSchema>,
): Promise<string> {
  const user = await requireRole("finance");
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
    isSharedLink: true,
    requestedExternally: true,
    invitedName: args.invitedName,
    invitedEmail: args.invitedEmail,
  });

  if (args.invitedEmail) await sendSubmissionRequestedEmail(id);

  return id;
}
