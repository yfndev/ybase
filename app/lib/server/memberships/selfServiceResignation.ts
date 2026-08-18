import { requireUser } from "../../auth/session";
import {
  membershipResignationRequests,
  memberships,
} from "../../db/collections";
import type { Membership, MembershipLegalStatus } from "../../db/types";
import { formatBerlinIsoDate, parseBerlinDate } from "../../members/berlinDate";
import { ageOnDate, resignationEndAt } from "../../members/legalDates";
import { sendResignationConfirmation } from "./resignationEmail";
import {
  RESIGNATION_DECLARATION_TEXT,
  RESIGNATION_DECLARATION_VERSION,
} from "./resignationDeclaration";
import { scheduleRecordedResignation } from "./resignationScheduling";
import {
  markResignationConfirmationSent,
  requestGuardianConfirmation,
  storeReceivedResignation,
} from "./resignationRequestStore";
import { membershipRequestMetadata } from "./requestMetadata";

export interface OwnMembershipOverview {
  membershipNumber: string;
  memberName: string;
  admittedAt: number;
  legalStatus: MembershipLegalStatus;
  scheduledEndAt?: number;
  scheduledEndReason?: Membership["scheduledEndReason"];
  expectedEndAt: number;
  isMinor: boolean;
  guardianEmail?: string;
  requestStatus?: "pending_guardian" | "received";
  confirmationEmailSent: boolean;
}

export interface ResignationSubmissionResult {
  status: "pending_guardian" | "received";
  scheduledEndAt: number;
  emailSent: boolean;
}

export async function getOwnMembershipOverview(): Promise<OwnMembershipOverview | null> {
  const actor = await requireUser();
  const membership = await findOwnCurrentMembership(
    actor._id,
    actor.organizationId,
  );
  if (!membership) return null;
  const now = Date.now();
  const request = await (
    await membershipResignationRequests()
  ).findOne({ _id: membership._id, userId: actor._id });
  return {
    membershipNumber: membership.membershipNumber,
    memberName: `${membership.firstName} ${membership.lastName}`,
    admittedAt: membership.admittedAt,
    legalStatus: membership.legalStatus,
    scheduledEndAt: membership.scheduledEndAt,
    scheduledEndReason: membership.scheduledEndReason,
    expectedEndAt: resignationEndAt(todayInBerlin(now)),
    isMinor: ageOnDate(membership.dateOfBirth, now) < 18,
    guardianEmail: membership.guardianConsent?.representativeEmail,
    requestStatus: request?.status,
    confirmationEmailSent:
      !request || request.confirmationEmailSentAt !== undefined,
  };
}

export async function requestOwnMembershipResignation(): Promise<ResignationSubmissionResult> {
  const actor = await requireUser();
  const membership = await findOwnCurrentMembership(
    actor._id,
    actor.organizationId,
  );
  if (!membership)
    throw new Error("Es wurde keine aktive Mitgliedschaft gefunden.");
  assertCanResign(membership);
  if (
    membership.scheduledEndReason === "resignation" &&
    membership.scheduledEndAt
  ) {
    return resendRecordedConfirmation(membership);
  }

  const now = Date.now();
  const receivedAt = todayInBerlin(now);
  const expectedEndAt = resignationEndAt(receivedAt);
  const metadata = await membershipRequestMetadata();
  if (ageOnDate(membership.dateOfBirth, now) < 18) {
    return requestGuardianConfirmation({
      membership,
      now,
      expectedEndAt,
      metadata,
    });
  }

  const scheduledEndAt = await scheduleRecordedResignation({
    membership,
    receivedAt,
    recordedAt: now,
    actorUserId: actor._id,
    actorType: "user",
    eventDetails: declarationDetails("member_portal", now),
  });
  await storeReceivedResignation({
    membership,
    requestedAt: now,
    receivedAt,
    scheduledEndAt,
    metadata,
  });
  const emailSent = await sendResignationConfirmation({
    member: membership,
    receivedAt,
    scheduledEndAt,
  });
  if (emailSent) await markResignationConfirmationSent(membership._id, now);
  return { status: "received", scheduledEndAt, emailSent };
}

async function findOwnCurrentMembership(
  userId: string,
  organizationId: string,
) {
  return (await memberships()).findOne({
    userId,
    organizationId,
    isCurrent: true,
  });
}

function assertCanResign(membership: Membership) {
  if (!["active", "resigning"].includes(membership.legalStatus)) {
    throw new Error("Diese Mitgliedschaft kann nicht beendet werden.");
  }
  if (
    membership.scheduledEndAt &&
    membership.scheduledEndReason !== "resignation"
  ) {
    throw new Error(
      "Für diese Mitgliedschaft ist bereits ein Ende vorgemerkt.",
    );
  }
}

function todayInBerlin(now: number) {
  return parseBerlinDate(formatBerlinIsoDate(now));
}

function declarationDetails(source: string, requestedAt: number) {
  return {
    source,
    declarationText: RESIGNATION_DECLARATION_TEXT,
    declarationVersion: RESIGNATION_DECLARATION_VERSION,
    requestedAt,
  };
}

async function resendRecordedConfirmation(
  membership: Membership,
): Promise<ResignationSubmissionResult> {
  const request = await (
    await membershipResignationRequests()
  ).findOne({ _id: membership._id });
  const receivedAt = membership.resignationReceivedAt ?? request?.receivedAt;
  if (receivedAt === undefined || membership.scheduledEndAt === undefined) {
    throw new Error("Die Austrittserklärung ist unvollständig hinterlegt.");
  }
  const emailSent = await sendResignationConfirmation({
    member: membership,
    receivedAt,
    scheduledEndAt: membership.scheduledEndAt,
    guardian: request?.guardianEmail
      ? {
          name: request.guardianName ?? "",
          email: request.guardianEmail,
        }
      : undefined,
  });
  if (emailSent) {
    await markResignationConfirmationSent(membership._id, Date.now());
  }
  return {
    status: "received",
    scheduledEndAt: membership.scheduledEndAt,
    emailSent,
  };
}
