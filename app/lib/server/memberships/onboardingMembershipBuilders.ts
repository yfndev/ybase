import { applications } from "../../db/collections";
import { newId } from "../../db/ids";
import type { Application, Membership, User } from "../../db/types";
import { loadApplicationMemberPlatformSnapshot } from "../applications/memberPlatformCandidates";

export async function buildAcceptedApplicantMembership(
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

export async function buildManualMembership(
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
    admittedAt: admittedAt(user),
    privateEmail,
    firstName,
    lastName,
    dateOfBirth: snapshot.dateOfBirth,
    ...(user.phone?.trim() ? { phone: user.phone.trim() } : {}),
    memberPlatformUserId: snapshot.memberPlatformUserId,
    updatedAt: now,
  };
}

function buildMembership(user: User, application: Application): Membership {
  if (!application.dateOfBirth || !application.memberPlatformUserId) {
    throw new Error("Geburtsdatum oder Member-Profil fehlen.");
  }
  const now = Date.now();
  const { firstName, lastName } = splitMemberName(
    application.applicantName ?? user.name,
  );
  return {
    _id: newId(),
    _creationTime: now,
    organizationId: application.organizationId,
    userId: user._id,
    applicationId: application._id,
    membershipNumber: newMembershipNumber(now),
    isCurrent: true,
    legalStatus: "active",
    admittedAt: admittedAt(user),
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

function admittedAt(user: User): number {
  return user.gettingToKnow?.decidedAt ?? Date.now();
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
