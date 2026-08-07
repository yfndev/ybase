"use server";

import { z } from "zod";
import { memberships } from "../../db/collections";
import { formatBerlinIsoDate, parseBerlinDate } from "../../members/berlinDate";
import { resignationEndAt } from "../../members/legalDates";
import { loadManagedMember } from "../users/access";
import { scheduleMembershipEnd } from "./termination";

const resignationSchema = z.object({
  userId: z.string().min(1),
  receivedOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte gib ein gültiges Datum an."),
});

export async function recordMembershipResignation(input: {
  userId: string;
  receivedOn: string;
}): Promise<{ scheduledEndAt: number }> {
  const parsed = resignationSchema.parse(input);
  const { currentUser, target } = await loadManagedMember(parsed.userId);
  if (!target.membershipId) {
    throw new Error("Für dieses Mitglied wird keine Mitgliedschaft verwaltet.");
  }

  const receivedAt = parseBerlinDate(parsed.receivedOn);
  if (receivedAt > Date.now()) {
    throw new Error("Das Eingangsdatum darf nicht in der Zukunft liegen.");
  }

  const membership = await (
    await memberships()
  ).findOne({
    _id: target.membershipId,
    userId: target._id,
    organizationId: currentUser.organizationId,
    isCurrent: true,
    legalStatus: { $in: ["active", "resigning"] },
  });
  if (!membership) {
    throw new Error("Aktive Mitgliedschaft nicht gefunden.");
  }
  if (parsed.receivedOn < formatBerlinIsoDate(membership.admittedAt)) {
    throw new Error("Das Eingangsdatum liegt vor Beginn der Mitgliedschaft.");
  }

  const scheduledEndAt = resignationEndAt(receivedAt);
  const isScheduled = await scheduleMembershipEnd({
    membership,
    reason: "resignation",
    scheduledEndAt,
    resignationReceivedAt: receivedAt,
    actorUserId: currentUser._id,
  });
  if (!isScheduled) {
    const stored = await (await memberships()).findOne({ _id: membership._id });
    const isAlreadyRecorded =
      stored?.scheduledEndReason === "resignation" &&
      stored.resignationReceivedAt === receivedAt &&
      stored.scheduledEndAt === scheduledEndAt;
    if (!isAlreadyRecorded) {
      throw new Error(
        "Für diese Mitgliedschaft ist bereits ein früheres Ende vorgemerkt.",
      );
    }
  }

  return { scheduledEndAt };
}
