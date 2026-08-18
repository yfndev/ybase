import { memberships } from "../../db/collections";
import type { Membership } from "../../db/types";
import { ageLimitAt, calendarDaysUntil } from "../../members/legalDates";
import { finalizeMembershipEnd, scheduleMembershipEnd } from "./termination";

export interface MembershipJobResult {
  ageOutsScheduled: number;
  membershipsEnded: number;
  accessRetries: number;
  failures: number;
}

export async function processDailyMemberships(
  now = Date.now(),
): Promise<MembershipJobResult> {
  const result: MembershipJobResult = {
    ageOutsScheduled: 0,
    membershipsEnded: 0,
    accessRetries: 0,
    failures: 0,
  };
  const collection = await memberships();
  const dueMemberships = await collection
    .find({
      isCurrent: true,
      legalStatus: { $in: ["resigning", "suspended"] },
      scheduledEndAt: { $lte: now },
      scheduledEndReason: { $in: ["resignation", "age_limit"] },
    })
    .toArray();
  for (const membership of dueMemberships) {
    try {
      const isEnded = await finalizeMembershipEnd(
        membership,
        membership.scheduledEndReason ?? "resignation",
        membership.scheduledEndAt ?? now,
      );
      if (isEnded) result.membershipsEnded += 1;
    } catch {
      result.failures += 1;
    }
  }

  const ageOutCandidates = await collection
    .find({
      isCurrent: true,
      legalStatus: { $in: ["active", "resigning", "suspended"] },
    })
    .toArray();
  for (const membership of ageOutCandidates) {
    try {
      await processAgeOut(membership, now, result);
    } catch {
      result.failures += 1;
    }
  }

  const retryCandidates = await collection
    .find({
      legalStatus: "ended",
      $or: [
        { userLifecycleSyncedAt: { $exists: false } },
        {
          workspaceSuspendedAt: { $exists: false },
          workspaceSuspensionNotRequiredAt: { $exists: false },
        },
      ],
    })
    .toArray();
  for (const membership of retryCandidates) {
    try {
      await finalizeMembershipEnd(
        membership,
        membership.endReason ?? "resignation",
        membership.endedAt ?? now,
      );
      result.accessRetries += 1;
    } catch {
      result.failures += 1;
    }
  }
  return result;
}

async function processAgeOut(
  membership: Membership,
  now: number,
  result: MembershipJobResult,
): Promise<void> {
  const scheduledEndAt = ageLimitAt(membership.dateOfBirth);
  if (scheduledEndAt <= now) {
    const isEnded = await finalizeMembershipEnd(
      membership,
      "age_limit",
      scheduledEndAt,
    );
    if (isEnded) result.membershipsEnded += 1;
    return;
  }
  if (calendarDaysUntil(scheduledEndAt, now) > 30) return;
  const isScheduled = await scheduleMembershipEnd({
    membership,
    reason: "age_limit",
    scheduledEndAt,
    recordedAt: now,
  });
  if (isScheduled) result.ageOutsScheduled += 1;
}
