import { normalizeYfnEmail } from "../../applications/yfnEmail";
import { users } from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import { newId } from "../../db/ids";
import type { Application, User } from "../../db/types";

interface AcceptedApplicantMemberInput {
  application: Application;
  email: string;
  googleWorkspaceUserId: string;
  organizationId: string;
  teamId: string;
}

export async function createAcceptedApplicantMember(
  input: AcceptedApplicantMemberInput,
): Promise<{ isCreated: boolean; member: User }> {
  const userCollection = await users();
  const existing = await userCollection.findOne({
    applicationId: input.application._id,
    organizationId: input.organizationId,
  });
  if (existing) return { isCreated: false, member: existing };

  const now = Date.now();
  const member: User = {
    _id: newId(),
    _creationTime: now,
    name: input.application.applicantName,
    email: normalizeYfnEmail(input.email),
    googleWorkspaceUserId: input.googleWorkspaceUserId,
    organizationId: input.organizationId,
    role: "member",
    teamId: input.teamId,
    applicationId: input.application._id,
    memberStatus: "onboarding",
    teamOnboardingStatus: "not_started",
    publicProfileSetupRequired: true,
    registeredAt: now,
  };

  try {
    await userCollection.insertOne(member);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new Error(
        "Das Mitglied konnte nicht eindeutig mit der Bewerbung verknüpft werden.",
      );
    }
    throw error;
  }

  return { isCreated: true, member };
}

export async function rollbackAcceptedApplicantMember(
  applicationId: string,
  memberId: string,
  organizationId: string,
): Promise<void> {
  await (
    await users()
  ).deleteOne({
    _id: memberId,
    applicationId,
    memberStatus: "onboarding",
    organizationId,
  });
}
