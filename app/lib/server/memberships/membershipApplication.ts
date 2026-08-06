"use server";

import { z } from "zod";
import { memberships, organizations, users } from "../../db/collections";
import { MEMBERSHIP_GENDERS } from "../../members/gender";
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
  place: z.string().trim().min(2).max(100),
  signatureStorageKey: z.string().min(1),
  profileDataConfirmed: z.literal(true),
  privacyAccepted: z.literal(true),
  supportsAssociationPurposes: z.literal(true),
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

  const signature = await loadAndClaimMembershipSignature(
    parsed.signatureStorageKey,
    actor,
    { type: "membershipApplication", id: membership._id },
  );
  const signedAt = Date.now();
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
    place: parsed.place,
    signedAt,
    signaturePng: signature,
    guardianConsent: membership.guardianConsent,
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
          place: parsed.place,
          signedAt,
          signatureStorageKey: parsed.signatureStorageKey,
          ...(await membershipRequestMetadata()),
        },
        admissionEvidenceStorageKey: evidenceStorageKey,
        profileConfirmedAt: signedAt,
        purposesConfirmedAt: signedAt,
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
