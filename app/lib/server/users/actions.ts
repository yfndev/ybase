"use server";

import { z } from "zod";
import {
  requirePermission,
  requireRole,
  requireUser,
} from "../../auth/session";
import { teams, users } from "../../db/collections";
import type { User, UserRole } from "../../db/types";
import { addLog } from "../logs";
import { bankDetailsSchema } from "../bankDetails";
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const roleSchema = z.enum(["admin", "finance", "people_culture", "member"]);
const memberStatusSchema = z.enum(["onboarding", "active", "offboarded"]);
const teamOnboardingSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);

async function loadManagedMember(userId: string) {
  const currentUser = await requirePermission("manage_members");
  const target = await (await users()).findOne({ _id: userId });
  if (!target || target.organizationId !== currentUser.organizationId)
    throw new Error("User not found");
  return { currentUser, target };
}

async function requireActiveTeam(teamId: string, organizationId: string) {
  const team = await (await teams()).findOne({ _id: teamId });
  const isUsable =
    team && team.organizationId === organizationId && !team.isArchived;
  if (!isUsable) throw new Error("Team nicht verfügbar");
  return team;
}

export async function addUserToOrganization(input: {
  userId: string;
  organizationId: string;
  role?: UserRole;
}): Promise<void> {
  const currentUser = await requireRole("admin");
  const { userId, organizationId, role } = z
    .object({
      userId: z.string(),
      organizationId: z.string(),
      role: roleSchema.optional(),
    })
    .parse(input);

  if (organizationId !== currentUser.organizationId) {
    throw new Error("Cannot add users to other organizations");
  }

  const result = await (
    await users()
  ).updateOne(
    {
      _id: userId,
      $or: [
        { organizationId: { $exists: false } },
        { organizationId: currentUser.organizationId },
      ],
    },
    { $set: { organizationId, role: role ?? "member" } },
  );
  if (result.matchedCount !== 1) throw new Error("User not found");
}

export async function updateUserRole(input: {
  userId: string;
  role: UserRole;
}): Promise<void> {
  const currentUser = await requireRole("admin");
  const { userId, role } = z
    .object({ userId: z.string(), role: roleSchema })
    .parse(input);

  const targetUser = await (await users()).findOne({ _id: userId });

  if (!targetUser) throw new Error("User not found");
  if (targetUser.organizationId !== currentUser.organizationId)
    throw new Error("Access denied");

  if (targetUser.role === "admin" && role !== "admin") {
    const admins = await (await users())
      .find({ organizationId: currentUser.organizationId, role: "admin" })
      .limit(2)
      .toArray();
    if (admins.length <= 1)
      throw new Error(
        "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
      );
  }

  const oldRole = targetUser.role ?? "member";
  await (await users()).updateOne({ _id: userId }, { $set: { role } });
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "user.role_change",
    userId,
    `${targetUser.name ?? targetUser.email}: ${oldRole} → ${role}`,
  );
}

export async function updateBankDetails(input: {
  iban: string;
  bic: string;
  accountHolder: string;
}): Promise<void> {
  const user = await requireUser();
  const { iban, bic, accountHolder } = bankDetailsSchema.parse(input);

  await (
    await users()
  ).updateOne({ _id: user._id }, { $set: { iban, bic, accountHolder } });
}

export async function updateMemberProfile(input: {
  userId: string;
  teamId?: string;
  positionTitle?: string;
}): Promise<void> {
  const { userId, teamId, positionTitle } = z
    .object({
      userId: z.string(),
      teamId: z.string().trim().min(1).optional(),
      positionTitle: z.string().trim().min(1).optional(),
    })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);

  const patch: Pick<User, "teamId" | "positionTitle"> = {};
  if (teamId !== undefined) {
    await requireActiveTeam(teamId, currentUser.organizationId);
    patch.teamId = teamId;
  }
  if (positionTitle !== undefined) patch.positionTitle = positionTitle;
  if (Object.keys(patch).length === 0) return;

  await (await users()).updateOne({ _id: target._id }, { $set: patch });
}

export async function setMemberStatus(input: {
  userId: string;
  status: "onboarding" | "active" | "offboarded";
}): Promise<void> {
  const { userId, status } = z
    .object({ userId: z.string(), status: memberStatusSchema })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);

  if (status === "active" && target.teamOnboardingStatus !== "completed") {
    throw new Error("Das Teammitglied kann erst nach Abschluss aller Onboarding-Aufgaben freigegeben werden.");
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
    throw new Error("Das Onboarding eines freigegebenen Teammitglieds kann nicht erneut geöffnet werden.");
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
