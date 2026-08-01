"use server";

import { z } from "zod";
import { users } from "../../db/collections";
import type { MemberStatus, Team } from "../../db/types";
import { isPublicMemberStatus } from "../../members/status";
import { addLog } from "../logs";
import {
  loadManagedMember,
  requireActiveOrganizationDepartment,
  requireActiveOrganizationTeam,
} from "./access";
import { notifyTeamOnboardingChange } from "./email";
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const memberStatusSchema = z.enum([
  "onboarding",
  "active",
  "offboarding_planned",
  "offboarding",
  "archived",
  "excluded",
]);
const teamOnboardingSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);

export async function setMemberStatus(input: {
  userId: string;
  status: MemberStatus;
}): Promise<void> {
  const { userId, status } = z
    .object({ userId: z.string(), status: memberStatusSchema })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);
  if (target.membershipId) {
    throw new Error(
      "Der Status dieses Mitglieds wird durch den Mitgliedschaftsvorgang gesteuert.",
    );
  }
  if (status === "active" && (target.memberInfractions?.length ?? 0) >= 2) {
    throw new Error(
      "Ein Mitglied mit zwei Verstößen kann nicht erneut aktiviert werden.",
    );
  }
  if (status === "active" && target.teamOnboardingStatus !== "completed") {
    throw new Error(
      "Das Teammitglied kann erst nach Abschluss aller Onboarding-Aufgaben freigegeben werden.",
    );
  }
  if (status === "active") {
    if (!target.name?.trim()) {
      throw new Error("Aktive Mitglieder benötigen einen Namen.");
    }
    let primaryTeam: Team | undefined;
    if (target.boardMembership) {
      if (target.teamId || target.isTeamLead) {
        throw new Error(
          "Vorstandsmitglieder haben kein Hauptteam. Nutze das weitere Team.",
        );
      }
      await requireActiveOrganizationDepartment(
        target.boardMembership.departmentId,
        currentUser.organizationId,
      );
    } else {
      if (!target.teamId) {
        throw new Error(
          "Aktive Mitglieder benötigen ein aktives Team oder ein Vorstands-Department.",
        );
      }
      primaryTeam = await requireActiveOrganizationTeam(
        target.teamId,
        currentUser.organizationId,
      );
      if (primaryTeam.isChapter && target.isTeamLead) {
        throw new Error("Chapter haben keine Lead-Position.");
      }
    }
    let secondaryTeam: Team | undefined;
    if (target.secondaryTeamId) {
      if (!target.boardMembership && target.secondaryTeamId === target.teamId) {
        throw new Error(
          "Hauptteam und weiteres Team müssen unterschiedlich sein.",
        );
      }
      secondaryTeam = await requireActiveOrganizationTeam(
        target.secondaryTeamId,
        currentUser.organizationId,
      );
      if (secondaryTeam.isChapter && target.isSecondaryTeamLead) {
        throw new Error("Chapter haben keine Lead-Position.");
      }
    } else if (target.isSecondaryTeamLead) {
      throw new Error("Ein Lead benötigt ein zugeordnetes weiteres Team.");
    }
  }
  if (target.memberStatus === status) return;

  const patch = memberStatusPatch(target.memberStatus, status, Date.now());
  const result = await (
    await users()
  ).updateOne(
    { _id: target._id, memberStatus: target.memberStatus },
    { $set: patch },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Das Mitglied wurde zwischenzeitlich geändert.");
  }
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
  if (isPublicMemberStatus(target.memberStatus) && status !== "completed") {
    throw new Error(
      "Das Onboarding eines freigegebenen Teammitglieds kann nicht erneut geöffnet werden.",
    );
  }
  if (target.teamOnboardingStatus === status) return;

  const patch = teamOnboardingPatch(
    target.teamOnboardingStatus,
    status,
    Date.now(),
  );
  const result = await (
    await users()
  ).updateOne(
    { _id: target._id, teamOnboardingStatus: target.teamOnboardingStatus },
    { $set: patch },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Das Mitglied wurde zwischenzeitlich geändert.");
  }
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.team_onboarding_change",
    target._id,
    `${target.name ?? target.email}: ${target.teamOnboardingStatus} → ${status}`,
  );
  await notifyTeamOnboardingChange({
    user: target,
    previous: target.teamOnboardingStatus,
    next: status,
  });
}
