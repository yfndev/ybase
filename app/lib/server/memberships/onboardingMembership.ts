import {
  applications,
  documentExecutions,
  memberships,
  users,
} from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import { newId } from "../../db/ids";
import type { Application, Membership, User } from "../../db/types";
import { loadApplicationMemberPlatformSnapshot } from "../applications/memberPlatformCandidates";
import {
  assertRequiredDocumentConfiguration,
  assignRequiredDocuments,
} from "./documentAssignments";
import { appendMembershipEvent } from "./events";

export async function ensureAcceptedApplicantMembership(
  user: User,
): Promise<Membership> {
  if (!user.organizationId) {
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

  const membership = user.applicationId
    ? await buildAcceptedApplicantMembership({
        ...user,
        organizationId: user.organizationId,
        applicationId: user.applicationId,
      })
    : await buildManualMembership({
        ...user,
        organizationId: user.organizationId,
      });
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

async function buildAcceptedApplicantMembership(
  user: User & { organizationId: string; applicationId: string },
): Promise<Membership> {
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
  return buildMembership(user, application);
}

async function buildManualMembership(
  user: User & { organizationId: string },
): Promise<Membership> {
  if (!user.memberPlatformUserId) {
    throw new Error("Das Member-Profil ist noch nicht verknüpft.");
  }
  const privateEmail = user.privateEmail?.trim().toLowerCase();
  if (!privateEmail) {
    throw new Error("Die private E-Mail-Adresse fehlt.");
  }
  const snapshot = await loadApplicationMemberPlatformSnapshot(
    user.memberPlatformUserId,
  );
  const now = Date.now();
  const { firstName, lastName } = splitMemberName(user.name);
  return {
    _id: newId(),
    _creationTime: now,
    organizationId: user.organizationId,
    userId: user._id,
    membershipNumber: newMembershipNumber(now),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: user.registeredAt ?? user._creationTime,
    privateEmail,
    firstName,
    lastName,
    dateOfBirth: snapshot.dateOfBirth,
    ...(user.phone?.trim() ? { phone: user.phone.trim() } : {}),
    memberPlatformUserId: snapshot.memberPlatformUserId,
    handoverTasks: [],
    updatedAt: now,
  };
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
  const { firstName, lastName } = splitMemberName(
    application.applicantName ?? user.name,
  );
  const guardian = application.guardianConsent;
  return {
    _id: newId(),
    _creationTime: now,
    organizationId: application.organizationId,
    userId: user._id,
    applicationId: application._id,
    membershipNumber: newMembershipNumber(now),
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
    lastName,
    dateOfBirth: application.dateOfBirth,
    ...(application.applicantPhone?.trim()
      ? { phone: application.applicantPhone.trim() }
      : {}),
    memberPlatformUserId: application.memberPlatformUserId,
    updatedAt: now,
  };
}

function splitMemberName(name?: string): {
  firstName: string;
  lastName: string;
} {
  const [firstName, ...lastNameParts] = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean) ?? [undefined];
  if (!firstName || lastNameParts.length === 0) {
    throw new Error("Der vollständige Name fehlt.");
  }
  return { firstName, lastName: lastNameParts.join(" ") };
}

function newMembershipNumber(now: number): string {
  return `YFN-${new Date(now).getUTCFullYear()}-${newId()
    .slice(0, 6)
    .toUpperCase()}`;
}
