"use server";

import { z } from "zod";
import { users } from "../../db/collections";
import type { GettingToKnowOutcome, User } from "../../db/types";
import { suspendWorkspaceUser } from "../../googleWorkspace/membershipLifecycle";
import { addLog } from "../logs";
import { loadManagedMember } from "../users/access";
import { sendUserStateEmail } from "../users/email";

const decisionSchema = z.object({ userId: z.string().min(1) });

export async function confirmGettingToKnow(input: {
  userId: string;
}): Promise<void> {
  const { currentUser, target } = await loadPhaseMember(input);
  if (target.gettingToKnow?.outcome) {
    throw new Error("Die Kennenlernphase ist bereits bestätigt.");
  }
  const decidedAt = Date.now();
  const result = await (
    await users()
  ).updateOne(
    {
      _id: target._id,
      memberStatus: "getting_to_know",
      "gettingToKnow.outcome": { $exists: false },
    },
    {
      $set: {
        "gettingToKnow.decidedAt": decidedAt,
        "gettingToKnow.decidedBy": currentUser._id,
        "gettingToKnow.outcome": "confirmed" satisfies GettingToKnowOutcome,
      },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Die Kennenlernphase wurde zwischenzeitlich geändert.");
  }
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.getting_to_know_confirmed",
    target._id,
    `${target.name ?? target.email}: Vereinsmitgliedschaft angestoßen`,
  );
  await sendUserStateEmail({ user: target, event: "membership_invitation" });
}

export async function endGettingToKnow(input: {
  userId: string;
}): Promise<void> {
  const { currentUser, target } = await loadPhaseMember(input);
  const endedAt = Date.now();
  const result = await (
    await users()
  ).updateOne(
    { _id: target._id, memberStatus: "getting_to_know" },
    {
      $set: {
        memberStatus: "archived",
        archivedAt: endedAt,
        "gettingToKnow.decidedAt": endedAt,
        "gettingToKnow.decidedBy": currentUser._id,
        "gettingToKnow.outcome": "ended" satisfies GettingToKnowOutcome,
      },
      $unset: {
        teamId: "",
        secondaryTeamId: "",
        isTeamLead: "",
        isSecondaryTeamLead: "",
      },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Die Kennenlernphase wurde zwischenzeitlich geändert.");
  }
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.getting_to_know_ended",
    target._id,
    `${target.name ?? target.email}: Kennenlernphase beendet`,
  );
  await sendUserStateEmail({ user: target, event: "getting_to_know_ended" });
  await suspendGettingToKnowAccess(target);
}

async function loadPhaseMember(input: { userId: string }) {
  const parsed = decisionSchema.parse(input);
  const { currentUser, target } = await loadManagedMember(parsed.userId);
  if (target.memberStatus !== "getting_to_know") {
    throw new Error("Diese Person ist nicht in der Kennenlernphase.");
  }
  if (target.membershipId) {
    throw new Error(
      "Für dieses Mitglied wird bereits eine Vereinsmitgliedschaft geführt.",
    );
  }
  return { currentUser, target };
}

async function suspendGettingToKnowAccess(target: User): Promise<void> {
  const userKey = target.googleWorkspaceUserId ?? target.email;
  if (!userKey) return;
  try {
    await suspendWorkspaceUser(userKey);
  } catch (error) {
    console.error("workspace suspension after getting-to-know end", error);
  }
}
