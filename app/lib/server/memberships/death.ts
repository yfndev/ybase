"use server";

import { z } from "zod";
import { requirePermission } from "../../auth/session";
import { memberships } from "../../db/collections";
import { finalizeMembershipEnd } from "./termination";

export async function recordMemberDeath(input: {
  membershipId: string;
  eventDate: number;
}): Promise<void> {
  const parsed = z
    .object({
      membershipId: z.string().min(1),
      eventDate: z.number().int().positive().max(Date.now()),
    })
    .parse(input);
  const actor = await requirePermission("manage_members");
  const membership = await (
    await memberships()
  ).findOne({
    _id: parsed.membershipId,
    organizationId: actor.organizationId,
    isCurrent: true,
  });
  if (!membership) throw new Error("Aktive Mitgliedschaft nicht gefunden.");
  if (parsed.eventDate < membership.admittedAt) {
    throw new Error("Das Ereignisdatum liegt vor Beginn der Mitgliedschaft.");
  }
  await finalizeMembershipEnd(membership, "death", parsed.eventDate, actor._id);
}
