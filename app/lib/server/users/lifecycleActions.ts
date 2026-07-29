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
import { memberStatusPatch, teamOnboardingPatch } from "./memberLifecycle";

const memberStatusSchema = z.enum([
  "onboarding",
  "active",
  "inactive",
  "offboarding_planned",
  "offboarding",
  "archived",
  "offboarded",
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
  const { userId, status: parsedStatus } = z
    .object({ userId: z.string(), status: memberStatusSchema })
    .parse(input);
  const status = parsedStatus === "offboarded" ? "archived" : parsedStatus;
  const { currentUser, target } = await loadManagedMember(userId);
  if (status === "active" && target.teamOnboardingStatus !== "completed") {
    throw new Error(
      "Das Teammitglied kann erst nach Abschluss aller Onboarding-Aufgaben freigegeben werden.",
    );
  }
  if (status === "active") {
    if (!target.name?.trim()) {
      throw new Error("Aktive Mitglieder benötigen einen Namen.");
    }
    if (target.boardMembership) {
      if (
        target.teamId ||
        target.secondaryTeamId ||
        target.isTeamLead ||
        target.isSecondaryTeamLead
      ) {
        throw new Error(
          "Vorstandsmitglieder dürfen keinem Team direkt zugeordnet sein.",
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
      const team = await requireActiveOrganizationTeam(
        target.teamId,
        currentUser.organizationId,
      );
      if (team.isChapter && target.isTeamLead) {
        throw new Error("Chapter haben keine Lead-Position.");
      }
      let secondaryTeam: Team | undefined;
      if (target.secondaryTeamId) {
        if (target.secondaryTeamId === target.teamId) {
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
      if (
        target.positionTitle &&
        team.isChapter &&
        (!secondaryTeam || secondaryTeam.isChapter)
      ) {
        throw new Error("Chapter haben keine allgemeine Position.");
      }
    }
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
  if (isPublicMemberStatus(target.memberStatus) && status !== "completed") {
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
