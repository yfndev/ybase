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

export async function assertAcceptedApplicantMemberAvailable(input: {
  application: Application;
  email: string;
}): Promise<void> {
  const userCollection = await users();
  const [existingByEmail, existingByMemberProfile] = await Promise.all([
    userCollection.findOne({ email: normalizeYfnEmail(input.email) }),
    input.application.memberPlatformUserId
      ? userCollection.findOne({
          memberPlatformUserId: input.application.memberPlatformUserId,
        })
      : undefined,
  ]);
  if (
    existingByMemberProfile &&
    existingByMemberProfile.applicationId !== input.application._id
  ) {
    throw new Error(
      "Das Member-Profil ist bereits mit einem YBase-Nutzer verknüpft.",
    );
  }
  if (
    existingByEmail &&
    existingByEmail.applicationId !== input.application._id
  ) {
    throw new Error(
      "Diese Workspace-E-Mail gehört bereits zu einem YBase-Profil",
    );
  }
}

export async function createAcceptedApplicantMember(
  input: AcceptedApplicantMemberInput,
): Promise<{ isCreated: boolean; member: User }> {
  const userCollection = await users();
  const existing = await userCollection.findOne({
    applicationId: input.application._id,
    organizationId: input.organizationId,
  });
  if (existing) {
    if (existing.teamOnboardingStatus === "not_started") {
      await userCollection.updateOne(
        { _id: existing._id, teamOnboardingStatus: "not_started" },
        { $set: { teamOnboardingStatus: "in_progress" } },
      );
      existing.teamOnboardingStatus = "in_progress";
    }
    return { isCreated: false, member: existing };
  }

  const now = Date.now();
  const member: User = {
    _id: newId(),
    _creationTime: now,
    name: input.application.applicantName,
    email: normalizeYfnEmail(input.email),
    privateEmail: input.application.applicantEmailNormalized,
    ...(input.application.memberPlatformUserId
      ? {
          memberPlatformUserId: input.application.memberPlatformUserId,
          memberPlatformSyncedAt:
            input.application.memberPlatformSyncedAt ?? now,
        }
      : {}),
    ...(input.application.applicantPhone?.trim()
      ? { phone: input.application.applicantPhone.trim() }
      : {}),
    googleWorkspaceUserId: input.googleWorkspaceUserId,
    organizationId: input.organizationId,
    role: "member",
    teamId: input.teamId,
    applicationId: input.application._id,
    memberStatus: "onboarding",
    teamOnboardingStatus: "in_progress",
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
