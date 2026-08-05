import {
  applications,
  documentExecutions,
  memberships,
  users,
} from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import { newId } from "../../db/ids";
import type { Application, Membership, User } from "../../db/types";
import {
  assignRequiredDocuments,
  assertRequiredDocumentConfiguration,
} from "./documentAssignments";
import { appendMembershipEvent } from "./events";

export async function ensureAcceptedApplicantMembership(
  user: User,
): Promise<Membership> {
  if (!user.organizationId || !user.applicationId) {
    throw new Error(
      "Die Mitgliedschaft kann diesem Konto nicht zugeordnet werden.",
    );
  }

  const existing = await findCurrentMembership(user);
  if (existing) {
    await linkAndAssignMembership(user, existing);
    await recordAdmission(existing);
    return existing;
  }

  const application = await (
    await applications()
  ).findOne({
    _id: user.applicationId,
    organizationId: user.organizationId,
    status: "accepted",
  });
  if (!application) {
    throw new Error("Die angenommene Bewerbung wurde nicht gefunden.");
  }

  const membership = buildMembership(user, application);
  await assertRequiredDocumentConfiguration(membership, user);

  try {
    await (await memberships()).insertOne(membership);
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    const concurrent = await findCurrentMembership(user);
    if (!concurrent) throw error;
    await linkAndAssignMembership(user, concurrent);
    await recordAdmission(concurrent);
    return concurrent;
  }

  try {
    await assignRequiredDocuments(membership);
    const linked = await (
      await users()
    ).updateOne(
      {
        _id: user._id,
        organizationId: user.organizationId,
        memberStatus: "onboarding",
        $or: [
          { membershipId: { $exists: false } },
          { membershipId: membership._id },
        ],
      },
      { $set: { membershipId: membership._id } },
    );
    if (linked.matchedCount !== 1) {
      throw new Error("Die Mitgliedschaft konnte nicht verknüpft werden.");
    }
  } catch (error) {
    await Promise.all([
      (await documentExecutions()).deleteMany({ membershipId: membership._id }),
      (await memberships()).deleteOne({ _id: membership._id }),
    ]);
    throw error;
  }

  await recordAdmission(membership);
  return membership;
}

async function recordAdmission(membership: Membership): Promise<void> {
  await appendMembershipEvent({
    organizationId: membership.organizationId,
    membershipId: membership._id,
    userId: membership.userId,
    actorType: "system",
    type: "membership.admitted",
    idempotencyKey: `membership:${membership._id}:admitted`,
    occurredAt: membership.admittedAt,
    details: { membershipNumber: membership.membershipNumber },
  });
}

async function findCurrentMembership(user: User): Promise<Membership | null> {
  if (!user.organizationId) return null;
  return (await memberships()).findOne({
    organizationId: user.organizationId,
    isCurrent: true,
    $or: [
      { userId: user._id },
      ...(user.applicationId ? [{ applicationId: user.applicationId }] : []),
    ],
  });
}

async function linkAndAssignMembership(
  user: User,
  membership: Membership,
): Promise<void> {
  if (membership.userId !== user._id) {
    throw new Error("Die Mitgliedschaft ist bereits anders verknüpft.");
  }
  await assignRequiredDocuments(membership);
  if (user.membershipId === membership._id) return;
  const result = await (
    await users()
  ).updateOne(
    {
      _id: user._id,
      organizationId: membership.organizationId,
      $or: [
        { membershipId: { $exists: false } },
        { membershipId: membership._id },
      ],
    },
    { $set: { membershipId: membership._id } },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Die Mitgliedschaft ist bereits anders verknüpft.");
  }
}

function buildMembership(user: User, application: Application): Membership {
  if (!application.dateOfBirth || !application.memberPlatformUserId) {
    throw new Error("Geburtsdatum oder Member-Profil fehlen.");
  }
  const now = Date.now();
  const [firstName, ...lastNameParts] = (
    application.applicantName ??
    user.name ??
    ""
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!firstName || lastNameParts.length === 0) {
    throw new Error("Der vollständige Name fehlt in der Bewerbung.");
  }
  const guardian = application.guardianConsent;
  return {
    _id: newId(),
    _creationTime: now,
    organizationId: application.organizationId,
    userId: user._id,
    applicationId: application._id,
    membershipNumber: `YFN-${new Date(now).getUTCFullYear()}-${newId()
      .slice(0, 6)
      .toUpperCase()}`,
    isCurrent: true,
    legalStatus: "active",
    admittedAt:
      application.admissionDecision?.decidedAt ??
      application.onboardingStartedAt ??
      application.updatedAt ??
      now,
    ...(guardian?.signedAt
      ? {
          guardianConsent: {
            representativeName: guardian.representativeName,
            representativeEmail: guardian.representativeEmail,
            signedAt: guardian.signedAt,
            signatureStorageKey: guardian.signatureStorageKey,
            completedPdfStorageKey: guardian.completedPdfStorageKey,
            ipAddress: guardian.ipAddress,
            userAgent: guardian.userAgent,
          },
        }
      : {}),
    privateEmail: application.applicantEmailNormalized,
    firstName,
    lastName: lastNameParts.join(" "),
    dateOfBirth: application.dateOfBirth,
    ...(application.applicantPhone?.trim()
      ? { phone: application.applicantPhone.trim() }
      : {}),
    memberPlatformUserId: application.memberPlatformUserId,
    handoverTasks: [],
    updatedAt: now,
  };
}
