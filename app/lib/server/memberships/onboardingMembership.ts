import { documentExecutions, memberships, users } from "../../db/collections";
import { isDuplicateKeyError } from "../../db/errors";
import type { Membership, User } from "../../db/types";
import { isGettingToKnowConfirmed } from "../../members/gettingToKnow";
import {
  assertMembershipDocumentConfiguration,
  assignMembershipDocuments,
} from "./documentAssignments";
import { appendMembershipEvent } from "./events";
import {
  buildAcceptedApplicantMembership,
  buildManualMembership,
} from "./onboardingMembershipBuilders";

export async function ensureMembershipForAdmission(
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
  if (!isGettingToKnowConfirmed(user)) {
    throw new Error(
      "Die Vereinsmitgliedschaft wird erst nach der Kennenlernphase angelegt.",
    );
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
  await assertMembershipDocumentConfiguration(user);

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
    await assignMembershipDocuments(membership);
    const linked = await (
      await users()
    ).updateOne(
      {
        _id: user._id,
        organizationId: user.organizationId,
        memberStatus: "getting_to_know",
        "gettingToKnow.outcome": "confirmed",
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
  await assignMembershipDocuments(membership);
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
