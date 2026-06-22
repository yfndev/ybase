"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { volunteerAllowance } from "../../db/collections";
import { newId } from "../../db/ids";

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
