"use server";

import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { users } from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import { newId } from "../../db/ids";
import type { User } from "../../db/types";
import { YFN_ORGANIZATION } from "../../organization";
import { addLog } from "../logs";
import { requireActiveOrganizationTeam } from "./access";
import { phoneSchema, privateEmailSchema } from "./contactDetails";
import { provisionManualMemberWorkspace } from "./manualWorkspaceProvisioning";

const MEMBER_EMAIL_CONFLICT_MESSAGE =
  "Für diese E-Mail-Adresse gibt es bereits ein Profil.";

const createMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte gib den Namen des Mitglieds an.")
    .max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Bitte gib eine gültige E-Mail-Adresse an."))
    .refine(
      (email) => email.endsWith(`@${YFN_ORGANIZATION.domain}`),
      "Bitte gib eine gültige YFN-E-Mail-Adresse an.",
    ),
  privateEmail: privateEmailSchema,
  phone: phoneSchema.optional(),
  teamId: z.string().trim().min(1),
  isTeamLead: z.boolean(),
});

type CreateMemberInput = z.infer<typeof createMemberSchema>;

export async function createMember(input: CreateMemberInput): Promise<User> {
  const actor = await requirePermission("manage_members");
  const memberInput = createMemberSchema.parse(input);
  const usersCollection = await users();
  const [selectedTeam, existingMember] = await Promise.all([
    requireActiveOrganizationTeam(memberInput.teamId, actor.organizationId),
    usersCollection.findOne(
      { email: memberInput.email },
      { projection: { _id: 1 } },
    ),
  ]);
  if (selectedTeam.isChapter && memberInput.isTeamLead) {
    throw new Error("Chapter haben keine Lead-Position.");
  }
  if (existingMember) {
    throw new Error(MEMBER_EMAIL_CONFLICT_MESSAGE);
  }

  const createdAt = Date.now();
  const createdMember: User = {
    _id: newId(),
    _creationTime: createdAt,
    name: memberInput.name,
    email: memberInput.email,
    privateEmail: memberInput.privateEmail,
    ...(memberInput.phone ? { phone: memberInput.phone } : {}),
    organizationId: actor.organizationId,
    role: "member",
    teamId: memberInput.teamId,
    isTeamLead: memberInput.isTeamLead,
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
    publicProfileSetupRequired: true,
    registeredAt: createdAt,
  };

  try {
    await usersCollection.insertOne(createdMember);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(MEMBER_EMAIL_CONFLICT_MESSAGE);
    }
    throw error;
  }

  try {
    const workspaceAccount = await provisionManualMemberWorkspace({
      name: memberInput.name,
      primaryEmail: memberInput.email,
      privateEmail: memberInput.privateEmail,
    });
    const result = await usersCollection.updateOne(
      {
        _id: createdMember._id,
        organizationId: actor.organizationId,
        googleWorkspaceUserId: { $exists: false },
      },
      { $set: { googleWorkspaceUserId: workspaceAccount.userId } },
    );
    if (result.modifiedCount !== 1) {
      throw new Error("Google-Workspace-Konto konnte nicht verknüpft werden");
    }
    createdMember.googleWorkspaceUserId = workspaceAccount.userId;
  } catch (error) {
    await usersCollection.deleteOne({
      _id: createdMember._id,
      organizationId: actor.organizationId,
      googleWorkspaceUserId: { $exists: false },
    });
    throw error;
  }

  await addLog(
    actor.organizationId,
    actor._id,
    "member.created",
    createdMember._id,
    `${memberInput.name} (${memberInput.email})`,
  );
  return createdMember;
}
