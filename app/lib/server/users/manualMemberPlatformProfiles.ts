"use server";

import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { searchApplicationMemberPlatformCandidates } from "../applications/memberPlatformCandidates";

const manualMemberProfileSearchSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export async function searchManualMemberPlatformProfiles(input: {
  name: string;
}) {
  await requirePermission("manage_members");
  const lookup = manualMemberProfileSearchSchema.parse(input);
  return searchApplicationMemberPlatformCandidates({
    applicantName: lookup.name,
    privateEmail: "",
  });
}
