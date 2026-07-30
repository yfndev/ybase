"use server";

import type { Filter, UpdateFilter } from "mongodb";
import { z } from "zod";
import { users } from "../../db/collections";
import { newId } from "../../db/ids";
import type { MemberInfraction, User } from "../../db/types";
import { addLog } from "../logs";
import { loadManagedMember } from "./access";

const MAX_INFRACTIONS = 2;
const ELIGIBLE_STATUSES = ["active", "offboarding_planned"] as const;

const recordInfractionSchema = z.object({
  userId: z.string(),
  reason: z
    .string()
    .trim()
    .min(3, "Bitte beschreibe den Verstoß.")
    .max(1_000, "Die Beschreibung darf höchstens 1.000 Zeichen enthalten."),
});

type RecordInfractionInput = z.infer<typeof recordInfractionSchema>;

function validateTarget(target: User): number {
  if (!ELIGIBLE_STATUSES.some((status) => status === target.memberStatus)) {
    throw new Error(
      "Verstöße können nur bei aktiven oder vorgemerkten Mitgliedern hinterlegt werden.",
    );
  }
  const count = target.memberInfractions?.length ?? 0;
  if (count >= MAX_INFRACTIONS) {
    throw new Error(
      "Für dieses Mitglied sind bereits zwei Verstöße hinterlegt.",
    );
  }
  return count;
}

export async function recordMemberInfraction(input: RecordInfractionInput) {
  const { userId, reason } = recordInfractionSchema.parse(input);
  const { currentUser, target: initialTarget } =
    await loadManagedMember(userId);
  const collection = await users();
  const infraction: MemberInfraction = {
    _id: newId(),
    reason,
    createdAt: Date.now(),
    createdBy: currentUser._id,
  };
  let target = initialTarget;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const currentCount = validateTarget(target);
    const memberExcluded = currentCount === MAX_INFRACTIONS - 1;
    const filter: Filter<User> = {
      _id: target._id,
      organizationId: currentUser.organizationId,
      memberStatus: { $in: [...ELIGIBLE_STATUSES] },
      $expr: {
        $eq: [{ $size: { $ifNull: ["$memberInfractions", []] } }, currentCount],
      },
    };
    const update: UpdateFilter<User> = {
      $push: { memberInfractions: infraction },
    };
    if (memberExcluded) {
      update.$set = {
        memberStatus: "offboarding",
        offboardingStartedAt: infraction.createdAt,
      };
    }

    const result = await collection.updateOne(filter, update);
    if (result.modifiedCount === 1) {
      const infractionCount = currentCount + 1;
      await addLog(
        currentUser.organizationId,
        currentUser._id,
        "member.infraction_added",
        target._id,
        `${target.name ?? target.email}: Verstoß ${infractionCount}/${MAX_INFRACTIONS}`,
      );
      if (memberExcluded) {
        await addLog(
          currentUser.organizationId,
          currentUser._id,
          "member.status_change",
          target._id,
          `${target.name ?? target.email}: ${target.memberStatus} → offboarding (zweiter Verstoß)`,
        );
      }
      return { infractionCount, memberExcluded };
    }

    const refreshedTarget = await collection.findOne({
      _id: target._id,
      organizationId: currentUser.organizationId,
    });
    if (!refreshedTarget) throw new Error("Mitglied nicht gefunden.");
    target = refreshedTarget;
  }

  throw new Error(
    "Der Verstoß konnte wegen einer gleichzeitigen Änderung nicht gespeichert werden.",
  );
}
