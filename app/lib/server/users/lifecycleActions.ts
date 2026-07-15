"use server";

import { z } from "zod";
import { users } from "../../db/collections";
import { addLog } from "../logs";
import { loadManagedMember } from "./access";
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const memberStatusSchema = z.enum(["onboarding", "active", "offboarded"]);
const teamOnboardingSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);

export async function setMemberStatus(input: {
  userId: string;
  status: "onboarding" | "active" | "offboarded";
}): Promise<void> {
  const { userId, status } = z
    .object({ userId: z.string(), status: memberStatusSchema })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);
  if (status === "active" && target.teamOnboardingStatus !== "completed") {
    throw new Error(
      "Das Teammitglied kann erst nach Abschluss aller Onboarding-Aufgaben freigegeben werden.",
    );
  }

  const patch = memberStatusPatch(target.memberStatus, status, Date.now());
  await (await users()).updateOne({ _id: target._id }, { $set: patch });
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.status_change",
    target._id,
    `${target.name ?? target.email}: ${target.memberStatus} → ${status}`,
  );
}

export async function setTeamOnboardingStatus(input: {
  userId: string;
  status: "not_started" | "in_progress" | "completed";
}): Promise<void> {
  const { userId, status } = z
    .object({ userId: z.string(), status: teamOnboardingSchema })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);
  if (target.memberStatus === "active" && status !== "completed") {
    throw new Error(
      "Das Onboarding eines freigegebenen Teammitglieds kann nicht erneut geöffnet werden.",
    );
  }

  const patch = teamOnboardingPatch(
    target.teamOnboardingStatus,
    status,
    Date.now(),
  );
  await (await users()).updateOne({ _id: target._id }, { $set: patch });
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.team_onboarding_change",
    target._id,
    `${target.name ?? target.email}: ${target.teamOnboardingStatus} → ${status}`,
  );
}
