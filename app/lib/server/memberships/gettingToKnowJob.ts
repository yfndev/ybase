import { users } from "../../db/collections";
import type { User } from "../../db/types";
import { UNAVAILABLE_MEMBER_STATUSES } from "../../members/status";
import { sendGettingToKnowDueEmail } from "../users/email";

const REMINDER_LEAD_TIME = 7 * 24 * 60 * 60 * 1_000;

export interface GettingToKnowJobResult {
  remindersSent: number;
  failures: number;
}

export async function processGettingToKnowPhases(
  now = Date.now(),
): Promise<GettingToKnowJobResult> {
  const result: GettingToKnowJobResult = { remindersSent: 0, failures: 0 };
  const collection = await users();
  const due = await collection
    .find({
      memberStatus: "getting_to_know",
      "gettingToKnow.endsAt": { $lte: now + REMINDER_LEAD_TIME },
      "gettingToKnow.reminderSentAt": { $exists: false },
    })
    .toArray();

  for (const member of due) {
    try {
      const reserved = await collection.updateOne(
        {
          _id: member._id,
          memberStatus: "getting_to_know",
          "gettingToKnow.reminderSentAt": { $exists: false },
        },
        { $set: { "gettingToKnow.reminderSentAt": now } },
      );
      if (reserved.modifiedCount !== 1) continue;
      await notifyDecisionMakers(member);
      result.remindersSent += 1;
    } catch {
      result.failures += 1;
    }
  }
  return result;
}

async function notifyDecisionMakers(member: User): Promise<void> {
  const recipients = await (
    await users()
  )
    .find({
      organizationId: member.organizationId,
      memberStatus: { $nin: [...UNAVAILABLE_MEMBER_STATUSES] },
      $or: [
        { teamId: member.teamId, isTeamLead: true },
        { role: "people_culture" },
      ],
    })
    .toArray();
  for (const recipient of recipients) {
    await sendGettingToKnowDueEmail({
      recipient,
      member,
      endsAt: member.gettingToKnow?.endsAt ?? Date.now(),
    });
  }
}
