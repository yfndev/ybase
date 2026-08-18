import {
  membershipResignationRequests,
  memberships,
} from "../../db/collections";
import type { MembershipResignationRequest } from "../../db/types";
import { formatBerlinIsoDate, parseBerlinDate } from "../../members/berlinDate";
import { resignationEndAt } from "../../members/legalDates";
import { sendResignationConfirmation } from "./resignationEmail";
import { GUARDIAN_RESIGNATION_CONSENT_TEXT } from "./resignationDeclaration";
import { scheduleRecordedResignation } from "./resignationScheduling";
import { markResignationConfirmationSent } from "./resignationRequestStore";
import {
  hashResignationConsentToken,
  isResignationConsentToken,
} from "./resignationToken";
import { membershipRequestMetadata } from "./requestMetadata";

export interface GuardianResignationView {
  memberName: string;
  guardianName: string;
  declarationText: string;
  expectedEndAt: number;
  expiresAt: number;
}

export async function getGuardianResignationRequest(
  token: string,
): Promise<GuardianResignationView | null> {
  const request = await findPendingRequest(token);
  if (!request) return null;
  const expiresAt = request.guardianConsentExpiresAt;
  if (expiresAt === undefined) return null;
  const membership = await (
    await memberships()
  ).findOne({
    _id: request.membershipId,
    organizationId: request.organizationId,
    isCurrent: true,
  });
  if (!membership || !["active", "resigning"].includes(membership.legalStatus))
    return null;
  return {
    memberName: `${membership.firstName} ${membership.lastName}`,
    guardianName: request.guardianName ?? "gesetzliche Vertretung",
    declarationText: request.declarationText,
    expectedEndAt: resignationEndAt(todayInBerlin(Date.now())),
    expiresAt,
  };
}

export async function confirmGuardianResignation(token: string) {
  const request = await findPendingRequest(token);
  if (!request)
    throw new Error("Der Bestätigungslink ist ungültig oder abgelaufen.");
  const membership = await (
    await memberships()
  ).findOne({
    _id: request.membershipId,
    organizationId: request.organizationId,
    userId: request.userId,
    isCurrent: true,
  });
  if (!membership) throw new Error("Die Mitgliedschaft wurde nicht gefunden.");

  const now = Date.now();
  const receivedAt = todayInBerlin(now);
  const scheduledEndAt = await scheduleRecordedResignation({
    membership,
    receivedAt,
    recordedAt: now,
    actorType: "public_link",
    eventDetails: {
      source: "member_portal_guardian_confirmation",
      declarationText: request.declarationText,
      declarationVersion: request.declarationVersion,
      requestedAt: request.requestedAt,
      guardianConsentText: GUARDIAN_RESIGNATION_CONSENT_TEXT,
      guardianConfirmedAt: now,
    },
  });
  const metadata = await membershipRequestMetadata();
  const consumed = await (
    await membershipResignationRequests()
  ).updateOne(
    {
      _id: request._id,
      guardianTokenHash: request.guardianTokenHash,
      status: "pending_guardian",
    },
    {
      $set: {
        status: "received",
        receivedAt,
        scheduledEndAt,
        guardianConfirmedAt: now,
        ...guardianMetadataFields(metadata),
      },
      $unset: { guardianTokenHash: "", guardianConsentExpiresAt: "" },
    },
  );
  if (consumed.modifiedCount !== 1) {
    throw new Error("Der Bestätigungslink wurde bereits verwendet.");
  }
  const guardian = request.guardianEmail
    ? { name: request.guardianName ?? "", email: request.guardianEmail }
    : undefined;
  const emailSent = await sendResignationConfirmation({
    member: membership,
    receivedAt,
    scheduledEndAt,
    guardian,
  });
  if (emailSent) {
    await markResignationConfirmationSent(request._id, now);
  }
  return { scheduledEndAt, emailSent };
}

async function findPendingRequest(
  token: string,
): Promise<MembershipResignationRequest | null> {
  if (!isResignationConsentToken(token)) return null;
  return (await membershipResignationRequests()).findOne({
    guardianTokenHash: hashResignationConsentToken(token),
    status: "pending_guardian",
    guardianConsentExpiresAt: { $gt: Date.now() },
  });
}

function todayInBerlin(now: number) {
  return parseBerlinDate(formatBerlinIsoDate(now));
}

function guardianMetadataFields(metadata: {
  ipAddress?: string;
  userAgent?: string;
}) {
  return {
    ...(metadata.ipAddress ? { guardianIpAddress: metadata.ipAddress } : {}),
    ...(metadata.userAgent ? { guardianUserAgent: metadata.userAgent } : {}),
  };
}
