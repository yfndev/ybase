import {
  applications,
  documentExecutions,
  memberships,
  users,
} from "../../db/collections";
import { appendMembershipEvent } from "./events";

export async function activateMembershipOnboardingIfComplete(
  membershipId: string,
): Promise<boolean> {
  const membership = await (
    await memberships()
  ).findOne({
    _id: membershipId,
    isCurrent: true,
    legalStatus: { $in: ["active", "resigning"] },
  });
  if (!membership?.applicationSignature) {
    return false;
  }
  const assignedDocuments = await (
    await documentExecutions()
  ).countDocuments({ membershipId, status: "assigned" });
  if (assignedDocuments > 0) return false;

  const now = Date.now();
  const result = await (
    await users()
  ).updateOne(
    {
      _id: membership.userId,
      membershipId: membership._id,
      memberStatus: "onboarding",
    },
    { $set: { memberStatus: "active", onboardedAt: now } },
  );
  if (result.modifiedCount === 0) {
    const user = await (await users()).findOne({ _id: membership.userId });
    return user?.memberStatus === "active";
  }

  const applicationUpdate = membership.applicationId
    ? (await applications()).updateOne(
        {
          _id: membership.applicationId,
          onboardingCompletedAt: { $exists: false },
        },
        {
          $set: {
            onboardingCompletedAt: now,
            onboardingCompletedBy: membership.userId,
            updatedAt: now,
          },
        },
      )
    : Promise.resolve();
  await Promise.all([
    applicationUpdate,
    appendMembershipEvent({
      organizationId: membership.organizationId,
      membershipId: membership._id,
      userId: membership.userId,
      actorUserId: membership.userId,
      actorType: "user",
      type: "onboarding.completed",
      idempotencyKey: `membership:${membership._id}:onboarding-completed`,
      occurredAt: now,
      details: {},
    }),
  ]);
  return true;
}
