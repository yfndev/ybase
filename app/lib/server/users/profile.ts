"use server";

import { z } from "zod";
import type { UpdateFilter } from "mongodb";
import { requireUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { User } from "../../db/types";
import { bankDetailsSchema } from "../bankDetails";
import {
  loadManagedMember,
  requireActiveOrganizationDepartment,
  requireActiveOrganizationTeam,
} from "./access";

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
  teamId?: string | null;
  secondaryTeamId?: string | null;
  positionTitle?: string | null;
  isTeamLead?: boolean;
  isSecondaryTeamLead?: boolean;
  boardMembership?: {
    departmentId: string;
    isChair: boolean;
  } | null;
}): Promise<void> {
  const {
    userId,
    teamId,
    secondaryTeamId,
    positionTitle,
    isTeamLead,
    isSecondaryTeamLead,
    boardMembership,
  } = z
    .object({
      userId: z.string(),
      teamId: z.string().trim().min(1).nullable().optional(),
      secondaryTeamId: z.string().trim().min(1).nullable().optional(),
      positionTitle: z.string().trim().min(1).nullable().optional(),
      isTeamLead: z.boolean().optional(),
      isSecondaryTeamLead: z.boolean().optional(),
      boardMembership: z
        .object({
          departmentId: z.string().trim().min(1),
          isChair: z.boolean(),
        })
        .nullable()
        .optional(),
    })
    .parse(input);
  const { currentUser, target } = await loadManagedMember(userId);
  const hasBoardAssignment =
    boardMembership !== null &&
    (boardMembership !== undefined || target.boardMembership !== undefined);
  const joinsTeam =
    typeof teamId === "string" ||
    typeof secondaryTeamId === "string" ||
    isTeamLead === true ||
    isSecondaryTeamLead === true;
  if (hasBoardAssignment && joinsTeam) {
    throw new Error(
      "Vorstandsmitglieder werden einem Department statt einem Team zugeordnet.",
    );
  }
  const nextTeamId =
    teamId === undefined ? target.teamId : (teamId ?? undefined);
  const nextSecondaryTeamId =
    secondaryTeamId === undefined
      ? target.secondaryTeamId
      : (secondaryTeamId ?? undefined);
  const nextIsTeamLead = isTeamLead ?? target.isTeamLead ?? false;
  const nextIsSecondaryTeamLead =
    secondaryTeamId === null
      ? false
      : (isSecondaryTeamLead ?? target.isSecondaryTeamLead ?? false);
  if (nextTeamId && nextSecondaryTeamId && nextTeamId === nextSecondaryTeamId) {
    throw new Error("Hauptteam und weiteres Team müssen unterschiedlich sein.");
  }
  if (!hasBoardAssignment && nextIsTeamLead && !nextTeamId) {
    throw new Error("Ein Lead benötigt ein zugeordnetes Hauptteam.");
  }
  if (!hasBoardAssignment && nextIsSecondaryTeamLead && !nextSecondaryTeamId) {
    throw new Error("Ein Lead benötigt ein zugeordnetes weiteres Team.");
  }
  const [nextTeam, nextSecondaryTeam] = hasBoardAssignment
    ? [undefined, undefined]
    : await Promise.all([
        nextTeamId
          ? requireActiveOrganizationTeam(
              nextTeamId,
              currentUser.organizationId,
            )
          : undefined,
        nextSecondaryTeamId
          ? requireActiveOrganizationTeam(
              nextSecondaryTeamId,
              currentUser.organizationId,
            )
          : undefined,
      ]);
  if (nextIsTeamLead && nextTeam?.isChapter) {
    throw new Error("Chapter haben keine Lead-Position.");
  }
  if (nextIsSecondaryTeamLead && nextSecondaryTeam?.isChapter) {
    throw new Error("Chapter haben keine Lead-Position.");
  }
  const hasNonChapterTeam = [nextTeam, nextSecondaryTeam].some(
    (team) => team && !team.isChapter,
  );
  if (
    !hasBoardAssignment &&
    typeof positionTitle === "string" &&
    !hasNonChapterTeam
  ) {
    throw new Error("Chapter haben keine allgemeine Position.");
  }

  const patch: Partial<
    Pick<
      User,
      | "teamId"
      | "secondaryTeamId"
      | "positionTitle"
      | "isTeamLead"
      | "isSecondaryTeamLead"
      | "boardMembership"
    >
  > = {};
  if (teamId !== undefined && teamId !== null) {
    patch.teamId = teamId;
  }
  if (secondaryTeamId !== undefined && secondaryTeamId !== null) {
    patch.secondaryTeamId = secondaryTeamId;
  }
  if (positionTitle !== undefined && positionTitle !== null) {
    patch.positionTitle = positionTitle;
  }
  if (isTeamLead !== undefined) patch.isTeamLead = isTeamLead;
  if (isSecondaryTeamLead !== undefined) {
    patch.isSecondaryTeamLead = isSecondaryTeamLead;
  }
  if (secondaryTeamId === null) patch.isSecondaryTeamLead = false;
  if (boardMembership !== undefined && boardMembership !== null) {
    await requireActiveOrganizationDepartment(
      boardMembership.departmentId,
      currentUser.organizationId,
    );
    patch.boardMembership = boardMembership;
    patch.isTeamLead = false;
    patch.isSecondaryTeamLead = false;
  }

  const update: UpdateFilter<User> = {};
  if (Object.keys(patch).length > 0) update.$set = patch;
  if (
    teamId === null ||
    secondaryTeamId === null ||
    positionTitle === null ||
    (boardMembership !== undefined && boardMembership !== null) ||
    boardMembership === null
  ) {
    update.$unset = {
      ...(teamId === null ||
      (boardMembership !== undefined && boardMembership !== null)
        ? { teamId: "" }
        : {}),
      ...(secondaryTeamId === null ||
      (boardMembership !== undefined && boardMembership !== null)
        ? { secondaryTeamId: "" }
        : {}),
      ...(boardMembership === null ? { boardMembership: "" } : {}),
      ...(positionTitle === null ? { positionTitle: "" } : {}),
    };
  }
  if (Object.keys(update).length === 0) return;

  await (await users()).updateOne({ _id: target._id }, update);
}
