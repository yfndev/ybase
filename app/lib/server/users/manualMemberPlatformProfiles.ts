"use server";

import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { searchApplicationMemberPlatformCandidates } from "../applications/memberPlatformCandidates";
import { privateEmailSchema } from "./contactDetails";

const manualMemberProfileSearchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  privateEmail: privateEmailSchema,
});

export async function searchManualMemberPlatformProfiles(input: {
  name: string;
  privateEmail: string;
}) {
  await requirePermission("manage_members");
  const lookup = manualMemberProfileSearchSchema.parse(input);
  return searchApplicationMemberPlatformCandidates({
    applicantName: lookup.name,
    privateEmail: lookup.privateEmail,
  });
}
