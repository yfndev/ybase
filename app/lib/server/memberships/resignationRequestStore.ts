import { membershipResignationRequests } from "../../db/collections";
import type { Membership } from "../../db/types";
import { appendMembershipEvent } from "./events";
import { sendGuardianResignationRequest } from "./resignationEmail";
import {
  RESIGNATION_DECLARATION_TEXT,
  RESIGNATION_DECLARATION_VERSION,
} from "./resignationDeclaration";
import { createResignationConsentToken } from "./resignationToken";

const GUARDIAN_CONSENT_TTL = 14 * 24 * 60 * 60 * 1_000;
type RequestMetadata = { ipAddress?: string; userAgent?: string };

export async function requestGuardianConfirmation(input: {
  membership: Membership;
  now: number;
  expectedEndAt: number;
  metadata: RequestMetadata;
}) {
  const guardian = input.membership.guardianConsent;
  if (!guardian) {
    throw new Error("Es ist keine gesetzliche Vertretung hinterlegt.");
  }
  const { token, tokenHash } = createResignationConsentToken();
  const expiresAt = input.now + GUARDIAN_CONSENT_TTL;
  await (
    await membershipResignationRequests()
  ).updateOne(
    { _id: input.membership._id },
    {
      $set: {
        organizationId: input.membership.organizationId,
        membershipId: input.membership._id,
        userId: input.membership.userId,
        status: "pending_guardian",
        declarationText: RESIGNATION_DECLARATION_TEXT,
        declarationVersion: RESIGNATION_DECLARATION_VERSION,
        requestedAt: input.now,
        ...requesterFields(input.metadata),
        guardianName: guardian.representativeName,
        guardianEmail: guardian.representativeEmail,
        guardianTokenHash: tokenHash,
        guardianConsentExpiresAt: expiresAt,
      },
      $setOnInsert: { _creationTime: input.now },
      $unset: {
        receivedAt: "",
        scheduledEndAt: "",
        guardianConfirmedAt: "",
        guardianIpAddress: "",
        guardianUserAgent: "",
        confirmationEmailSentAt: "",
      },
    },
    { upsert: true },
  );
  await appendMembershipEvent({
    organizationId: input.membership.organizationId,
    membershipId: input.membership._id,
    userId: input.membership.userId,
    actorUserId: input.membership.userId,
    actorType: "user",
    type: "membership.resignation_guardian_requested",
    occurredAt: input.now,
    details: {
      source: "member_portal",
      declarationText: RESIGNATION_DECLARATION_TEXT,
      declarationVersion: RESIGNATION_DECLARATION_VERSION,
      requestedAt: input.now,
      expectedEndAt: input.expectedEndAt,
    },
  });
  const emailSent = await sendGuardianResignationRequest({
    member: input.membership,
    guardianName: guardian.representativeName,
    guardianEmail: guardian.representativeEmail,
    token,
    expectedEndAt: input.expectedEndAt,
    expiresAt,
  });
  return {
    status: "pending_guardian" as const,
    scheduledEndAt: input.expectedEndAt,
    emailSent,
  };
}

export async function storeReceivedResignation(input: {
  membership: Membership;
  requestedAt: number;
  receivedAt: number;
  scheduledEndAt: number;
  metadata: RequestMetadata;
}) {
  await (
    await membershipResignationRequests()
  ).updateOne(
    { _id: input.membership._id },
    {
      $set: {
        organizationId: input.membership.organizationId,
        membershipId: input.membership._id,
        userId: input.membership.userId,
        status: "received",
        declarationText: RESIGNATION_DECLARATION_TEXT,
        declarationVersion: RESIGNATION_DECLARATION_VERSION,
        requestedAt: input.requestedAt,
        receivedAt: input.receivedAt,
        scheduledEndAt: input.scheduledEndAt,
        ...requesterFields(input.metadata),
      },
      $setOnInsert: { _creationTime: input.requestedAt },
      $unset: { guardianTokenHash: "", guardianConsentExpiresAt: "" },
    },
    { upsert: true },
  );
}

export async function markResignationConfirmationSent(
  membershipId: string,
  sentAt: number,
) {
  try {
    await (
      await membershipResignationRequests()
    ).updateOne(
      { _id: membershipId },
      { $set: { confirmationEmailSentAt: sentAt } },
    );
  } catch (error) {
    console.error("Could not record resignation confirmation email", error);
  }
}

function requesterFields(metadata: RequestMetadata) {
  return {
    ...(metadata.ipAddress ? { requesterIpAddress: metadata.ipAddress } : {}),
    ...(metadata.userAgent ? { requesterUserAgent: metadata.userAgent } : {}),
  };
}
