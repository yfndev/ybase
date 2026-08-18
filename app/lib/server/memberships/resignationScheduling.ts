import { memberships } from "../../db/collections";
import type { Membership, MembershipEvent } from "../../db/types";
import { formatBerlinIsoDate } from "../../members/berlinDate";
import { resignationEndAt } from "../../members/legalDates";
import { scheduleMembershipEnd } from "./termination";

export async function scheduleRecordedResignation(input: {
  membership: Membership;
  receivedAt: number;
  recordedAt: number;
  actorUserId?: string;
  actorType?: MembershipEvent["actorType"];
  eventDetails: MembershipEvent["details"];
}): Promise<number> {
  if (
    formatBerlinIsoDate(input.receivedAt) <
    formatBerlinIsoDate(input.membership.admittedAt)
  ) {
    throw new Error(
      "Die Austrittserklärung liegt vor Beginn der Mitgliedschaft.",
    );
  }
  const scheduledEndAt = resignationEndAt(input.receivedAt);
  const isScheduled = await scheduleMembershipEnd({
    membership: input.membership,
    reason: "resignation",
    scheduledEndAt,
    resignationReceivedAt: input.receivedAt,
    recordedAt: input.recordedAt,
    actorUserId: input.actorUserId,
    actorType: input.actorType,
    eventDetails: input.eventDetails,
  });
  if (isScheduled) return scheduledEndAt;

  const stored = await (
    await memberships()
  ).findOne({ _id: input.membership._id });
  const isAlreadyRecorded =
    stored?.scheduledEndReason === "resignation" &&
    stored.resignationReceivedAt === input.receivedAt &&
    stored.scheduledEndAt === scheduledEndAt;
  if (!isAlreadyRecorded) {
    throw new Error(
      "Für diese Mitgliedschaft ist bereits ein früheres Ende vorgemerkt.",
    );
  }
  return scheduledEndAt;
}
