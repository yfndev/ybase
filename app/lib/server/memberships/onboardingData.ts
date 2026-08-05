"use server";

import { z } from "zod";
import { requireAuthenticatedUser } from "../../auth/session";
import {
  documentExecutions,
  documentVersions,
  memberships,
  users,
} from "../../db/collections";
import { activateMembershipOnboardingIfComplete } from "./onboardingCompletion";
import { ensureAcceptedApplicantMembership } from "./onboardingMembership";
import { appendMembershipEvent } from "./events";

const profileSchema = z.object({
  privateEmail: z.email(),
  phone: z.string().trim().max(50),
  street: z.string().trim().min(3).max(150),
  postalCode: z.string().trim().min(3).max(20),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  profileDataConfirmed: z.literal(true),
  supportsAssociationPurposes: z.literal(true),
});

export async function getOwnMembershipOnboardingContext() {
  const actor = await requireOnboardingUser(true);
  const membership = await ensureAcceptedApplicantMembership(actor);
  const activated = await activateMembershipOnboardingIfComplete(
    membership._id,
  );
  const executions = await (
    await documentExecutions()
  )
    .find({
      organizationId: membership.organizationId,
      membershipId: membership._id,
      userId: actor._id,
    })
    .sort({ assignedAt: 1 })
    .toArray();
  const versions = executions.length
    ? await (
        await documentVersions()
      )
        .find({
          organizationId: membership.organizationId,
          _id: {
            $in: executions.map(({ documentVersionId }) => documentVersionId),
          },
        })
        .toArray()
    : [];
  const versionsById = new Map(
    versions.map((version) => [version._id, version]),
  );

  return {
    activated,
    profile: {
      firstName: membership.firstName,
      lastName: membership.lastName,
      dateOfBirth: membership.dateOfBirth,
      privateEmail: membership.privateEmail,
      phone: membership.phone ?? "",
      address: membership.address ?? {
        street: "",
        postalCode: "",
        city: "",
        country: "Deutschland",
      },
      confirmed: Boolean(
        membership.profileConfirmedAt && membership.purposesConfirmedAt,
      ),
    },
    documents: executions.map((execution) => {
      const version = versionsById.get(execution.documentVersionId);
      return {
        executionId: execution._id,
        title: version?.title ?? "Dokument",
        versionLabel: version?.versionLabel ?? "",
        type: execution.executionType,
        status: execution.status,
        downloadUrl: `/api/membership-documents/${execution.documentVersionId}/download`,
      };
    }),
  };
}

export async function confirmOwnMembershipProfile(
  input: z.input<typeof profileSchema>,
): Promise<{ activated: boolean }> {
  const parsed = profileSchema.parse(input);
  const actor = await requireOnboardingUser();
  const membership = await ensureAcceptedApplicantMembership(actor);
  const now = Date.now();
  const phone = parsed.phone || undefined;
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
        privateEmail: parsed.privateEmail.toLowerCase(),
        address: {
          street: parsed.street,
          postalCode: parsed.postalCode,
          city: parsed.city,
          country: parsed.country,
        },
        profileConfirmedAt: now,
        purposesConfirmedAt: now,
        updatedAt: now,
        ...(phone ? { phone } : {}),
      },
      ...(!phone ? { $unset: { phone: "" } } : {}),
    },
  );
  if (result.matchedCount !== 1) {
    throw new Error("Die Mitgliedsdaten konnten nicht gespeichert werden.");
  }
  await (
    await users()
  ).updateOne(
    { _id: actor._id, organizationId: actor.organizationId },
    {
      $set: {
        privateEmail: parsed.privateEmail.toLowerCase(),
        ...(phone ? { phone } : {}),
      },
      ...(!phone ? { $unset: { phone: "" } } : {}),
    },
  );
  await appendMembershipEvent({
    organizationId: membership.organizationId,
    membershipId: membership._id,
    userId: actor._id,
    actorUserId: actor._id,
    actorType: "user",
    type: "onboarding.profile_confirmed",
    idempotencyKey: `membership:${membership._id}:profile-confirmed`,
    occurredAt: now,
    details: {},
  });
  return {
    activated: await activateMembershipOnboardingIfComplete(membership._id),
  };
}

async function requireOnboardingUser(allowCompleted = false) {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) throw new Error("User has no organization");
  if (
    actor.memberStatus !== "onboarding" &&
    !(allowCompleted && actor.memberStatus === "active")
  ) {
    throw new Error(
      "Das Mitgliedschafts-Onboarding ist bereits abgeschlossen.",
    );
  }
  if (!actor.memberPlatformUserId) {
    throw new Error("Das Member-Profil ist noch nicht verknüpft.");
  }
  return actor;
}

export type MembershipOnboardingContext = Awaited<
  ReturnType<typeof getOwnMembershipOnboardingContext>
>;
