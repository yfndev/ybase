"use server";

import { z } from "zod";
import { memberships, organizations, users } from "../../db/collections";
import type { GuardianConsentEvidence, User } from "../../db/types";
import { MEMBERSHIP_GENDERS } from "../../members/gender";
import { ageOnDate } from "../../members/legalDates";
import { membershipApplicationDirectory } from "../../s3/keys";
import { putObject } from "../../s3/storage";
import { requiredDocumentsComplete } from "./documentAssignments";
import { appendMembershipEvent } from "./events";
import { createMembershipApplicationPdf } from "./membershipApplicationPdf";
import { loadAndClaimMembershipSignature } from "./membershipSignatures";
import { requireOnboardingUser } from "./onboardingActor";
import { activateMembershipOnboardingIfComplete } from "./onboardingCompletion";
import { ensureAcceptedApplicantMembership } from "./onboardingMembership";
import { membershipRequestMetadata } from "./requestMetadata";

const applicationSchema = z.object({
  privateEmail: z.email(),
  phone: z.string().trim().min(5).max(50),
  gender: z.enum(MEMBERSHIP_GENDERS),
  street: z.string().trim().min(3).max(150),
  postalCode: z.string().trim().min(3).max(20),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  signatureStorageKey: z.string().min(1),
  guardianName: z.string().trim().min(2).max(200).optional(),
  guardianEmail: z.email().max(320).optional(),
  guardianSignatureStorageKey: z.string().min(1).optional(),
});

export async function submitOwnMembershipApplication(
  input: z.input<typeof applicationSchema>,
): Promise<{ activated: boolean }> {
  const parsed = applicationSchema.parse(input);
  const actor = await requireOnboardingUser();
  const membership = await ensureAcceptedApplicantMembership(actor);
  if (!(await requiredDocumentsComplete(membership._id))) {
    throw new Error(
      "Bitte schließe zuerst alle Unterlagen ab, bevor du den Mitgliedsantrag unterschreibst.",
    );
  }
  const organization = await (
    await organizations()
  ).findOne({ _id: membership.organizationId });
  if (!organization) throw new Error("Die Organisation wurde nicht gefunden.");

  const signedAt = Date.now();
  const guardian = await resolveGuardianConsent({
    form: parsed,
    actor,
    dateOfBirth: membership.dateOfBirth,
    membershipId: membership._id,
    signedAt,
  });
  const signature = await loadAndClaimMembershipSignature(
    parsed.signatureStorageKey,
    actor,
    { type: "membershipApplication", id: membership._id },
  );
  const privateEmail = parsed.privateEmail.toLowerCase();
  const address = {
    street: parsed.street,
    postalCode: parsed.postalCode,
    city: parsed.city,
    country: parsed.country,
  };
  const pdf = await createMembershipApplicationPdf({
    organization,
    membershipNumber: membership.membershipNumber,
    membershipId: membership._id,
    userId: actor._id,
    firstName: membership.firstName,
    lastName: membership.lastName,
    dateOfBirth: membership.dateOfBirth,
    gender: parsed.gender,
    phone: parsed.phone,
    privateEmail,
    address,
    signedAt,
    signaturePng: signature,
    guardian: guardian
      ? { ...guardian.consent, signaturePng: guardian.signaturePng }
      : undefined,
  });

  const directory = membershipApplicationDirectory(
    membership.organizationId,
    membership._id,
  );
  const evidenceStorageKey = `${directory}/membership-application.pdf`;
  await putObject(evidenceStorageKey, pdf, "application/pdf");

  const result = await (
    await memberships()
  ).updateOne(
    {
      _id: membership._id,
      userId: actor._id,
      organizationId: actor.organizationId,
      isCurrent: true,
    },
    {
      $set: {
        privateEmail,
        phone: parsed.phone,
        gender: parsed.gender,
        address,
        applicationSignature: {
          signedAt,
          signatureStorageKey: parsed.signatureStorageKey,
          ...(await membershipRequestMetadata()),
        },
        ...(guardian ? { guardianConsent: guardian.consent } : {}),
        admissionEvidenceStorageKey: evidenceStorageKey,
        updatedAt: signedAt,
      },
    },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Die Mitgliedsdaten konnten nicht gespeichert werden.");
  }
  await (
    await users()
  ).updateOne(
    { _id: actor._id, organizationId: actor.organizationId },
    { $set: { privateEmail, phone: parsed.phone } },
  );
  await appendMembershipEvent({
    organizationId: membership.organizationId,
    membershipId: membership._id,
    userId: actor._id,
    actorUserId: actor._id,
    actorType: "user",
    type: "membership.application_signed",
    idempotencyKey: `membership:${membership._id}:application-signed`,
    occurredAt: signedAt,
    details: {},
  });
  return {
    activated: await activateMembershipOnboardingIfComplete(membership._id),
  };
}

async function resolveGuardianConsent(input: {
  form: z.output<typeof applicationSchema>;
  actor: User & { organizationId: string };
  dateOfBirth: string;
  membershipId: string;
  signedAt: number;
}): Promise<
  { consent: GuardianConsentEvidence; signaturePng: Uint8Array } | undefined
> {
  if (ageOnDate(input.dateOfBirth, input.signedAt) >= 18) return undefined;

  const { guardianName, guardianEmail, guardianSignatureStorageKey } =
    input.form;
  if (!guardianName || !guardianEmail || !guardianSignatureStorageKey) {
    throw new Error(
      "Minderjährige benötigen die unterschriebene Zustimmung ihrer gesetzlichen Vertretung.",
    );
  }

  const signaturePng = await loadAndClaimMembershipSignature(
    guardianSignatureStorageKey,
    input.actor,
    { type: "membershipApplication", id: input.membershipId },
  );
  return {
    consent: {
      representativeName: guardianName,
      representativeEmail: guardianEmail.toLowerCase(),
      signedAt: input.signedAt,
      signatureStorageKey: guardianSignatureStorageKey,
      ...(await membershipRequestMetadata()),
    },
    signaturePng,
  };
}
