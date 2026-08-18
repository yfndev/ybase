import { applications, memberships, users } from "../../db/collections";
import type { User } from "../../db/types";
import { oneMonthAfter } from "../../members/legalDates";
import { addLog } from "../logs";
import { sendUserStateEmail } from "../users/email";
import {
  membershipDocumentsComplete,
  onboardingDocumentsComplete,
} from "./documentAssignments";
import { appendMembershipEvent } from "./events";

export async function startGettingToKnowIfComplete(
  user: User,
): Promise<boolean> {
  if (user.memberStatus !== "onboarding") return false;
  if (!(await onboardingDocumentsComplete(user._id))) return false;

  const startedAt = Date.now();
  const result = await (
    await users()
  ).updateOne(
    { _id: user._id, memberStatus: "onboarding" },
    {
      $set: {
        memberStatus: "getting_to_know",
        gettingToKnow: { startedAt, endsAt: oneMonthAfter(startedAt) },
      },
    },
  );
  if (result.modifiedCount === 0) return false;

  if (user.organizationId) {
    await addLog(
      user.organizationId,
      user._id,
      "member.getting_to_know_started",
      user._id,
    );
  }
  await sendUserStateEmail({ user, event: "getting_to_know_started" });
  return true;
}

export async function activateMembershipIfComplete(
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
  if (!(await membershipDocumentsComplete(membershipId))) return false;

  const now = Date.now();
  const result = await (
    await users()
  ).updateOne(
    {
      _id: membership.userId,
      membershipId: membership._id,
      memberStatus: "getting_to_know",
      "gettingToKnow.outcome": "confirmed",
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
