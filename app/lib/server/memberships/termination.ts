import { memberships, users } from "../../db/collections";
import type {
  Membership,
  MembershipEndReason,
  MembershipEvent,
} from "../../db/types";
import { syncEndedMembershipAccess } from "./accessClosure";
import { appendMembershipEvent } from "./events";

type ScheduledEndReason = Extract<
  MembershipEndReason,
  "resignation" | "age_limit"
>;

export async function scheduleMembershipEnd(input: {
  membership: Membership;
  reason: ScheduledEndReason;
  scheduledEndAt: number;
  actorUserId?: string;
  actorType?: MembershipEvent["actorType"];
  resignationReceivedAt?: number;
  recordedAt?: number;
  eventDetails?: MembershipEvent["details"];
}): Promise<boolean> {
  const { membership, reason, scheduledEndAt } = input;
  const recordedAt = input.recordedAt ?? Date.now();
  if (
    !membership.isCurrent ||
    !["active", "resigning"].includes(membership.legalStatus)
  ) {
    return false;
  }
  const currentEndAt = membership.scheduledEndAt;
  const shouldReplace =
    currentEndAt === undefined ||
    scheduledEndAt < currentEndAt ||
    (scheduledEndAt === currentEndAt &&
      reason === "age_limit" &&
      membership.scheduledEndReason !== "age_limit");
  const isAlreadyScheduled =
    currentEndAt === scheduledEndAt && membership.scheduledEndReason === reason;
  if (!shouldReplace && !isAlreadyScheduled) return false;

  let isChanged = false;
  if (!isAlreadyScheduled || membership.legalStatus !== "resigning") {
    const result = await (
      await memberships()
    ).updateOne(
      {
        _id: membership._id,
        organizationId: membership.organizationId,
        isCurrent: true,
        legalStatus: membership.legalStatus,
        ...(currentEndAt === undefined
          ? { scheduledEndAt: { $exists: false } }
          : { scheduledEndAt: currentEndAt }),
      },
      {
        $set: {
          legalStatus: "resigning",
          scheduledEndAt,
          scheduledEndReason: reason,
          ...(reason === "resignation" && input.resignationReceivedAt
            ? { resignationReceivedAt: input.resignationReceivedAt }
            : {}),
          updatedAt: recordedAt,
        },
      },
    );
    isChanged = result.modifiedCount === 1;
  }

  if (!isChanged && !isAlreadyScheduled) return false;
  await projectScheduledEndToMember(
    membership,
    Math.min(recordedAt, scheduledEndAt),
  );
  await appendMembershipEvent({
    organizationId: membership.organizationId,
    membershipId: membership._id,
    userId: membership.userId,
    actorUserId: input.actorUserId,
    actorType: input.actorType ?? (input.actorUserId ? "user" : "system"),
    type: "membership.end_scheduled",
    idempotencyKey: `membership:${membership._id}:scheduled:${reason}:${scheduledEndAt}`,
    occurredAt: recordedAt,
    details: { reason, scheduledEndAt, ...input.eventDetails },
  });
  return isChanged;
}

async function projectScheduledEndToMember(
  membership: Membership,
  plannedAt: number,
): Promise<void> {
  await (
    await users()
  ).updateOne(
    {
      _id: membership.userId,
      organizationId: membership.organizationId,
      membershipId: membership._id,
      memberStatus: { $in: ["onboarding", "active"] },
    },
    {
      $set: {
        memberStatus: "offboarding_planned",
        offboardingPlannedAt: plannedAt,
      },
    },
  );
}

export async function finalizeMembershipEnd(
  membership: Membership,
  reason: MembershipEndReason,
  effectiveAt: number,
  actorUserId?: string,
): Promise<boolean> {
  const result = await (
    await memberships()
  ).updateOne(
    {
      _id: membership._id,
      organizationId: membership.organizationId,
      isCurrent: true,
      legalStatus: { $ne: "ended" },
    },
    {
      $set: {
        legalStatus: "ended",
        isCurrent: false,
        endedAt: effectiveAt,
        endReason: reason,
        updatedAt: Date.now(),
      },
    },
  );
  const ended =
    result.modifiedCount === 1
      ? {
          ...membership,
          legalStatus: "ended" as const,
          isCurrent: false,
          endedAt: effectiveAt,
          endReason: reason,
        }
      : await (
          await memberships()
        ).findOne({
          _id: membership._id,
          organizationId: membership.organizationId,
          legalStatus: "ended",
        });
  if (!ended) return false;

  const recordedReason = ended.endReason ?? reason;
  const recordedEndAt = ended.endedAt ?? effectiveAt;
  await appendMembershipEvent({
    organizationId: ended.organizationId,
    membershipId: ended._id,
    userId: ended.userId,
    actorUserId,
    actorType: actorUserId ? "user" : "system",
    type: "membership.ended",
    idempotencyKey: `membership:${ended._id}:ended`,
    occurredAt: recordedEndAt,
    details: { reason: recordedReason, effectiveAt: recordedEndAt },
  });
  await syncEndedMembershipAccess(ended);
  return result.modifiedCount === 1;
}
