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
  positionTitle?: string | null;
  isTeamLead?: boolean;
  boardMembership?: {
    departmentId: string;
    isChair: boolean;
  } | null;
}): Promise<void> {
  const { userId, teamId, positionTitle, isTeamLead, boardMembership } = z
    .object({
      userId: z.string(),
      teamId: z.string().trim().min(1).nullable().optional(),
      positionTitle: z.string().trim().min(1).nullable().optional(),
      isTeamLead: z.boolean().optional(),
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
  if (
    hasBoardAssignment &&
    (typeof teamId === "string" || isTeamLead === true)
  ) {
    throw new Error(
      "Vorstandsmitglieder werden einem Department statt einem Team zugeordnet.",
    );
  }

  const patch: Partial<
    Pick<User, "teamId" | "positionTitle" | "isTeamLead" | "boardMembership">
  > = {};
  if (teamId !== undefined && teamId !== null) {
    await requireActiveOrganizationTeam(teamId, currentUser.organizationId);
    patch.teamId = teamId;
  }
  if (positionTitle !== undefined && positionTitle !== null) {
    patch.positionTitle = positionTitle;
  }
  if (isTeamLead !== undefined) patch.isTeamLead = isTeamLead;
  if (boardMembership !== undefined && boardMembership !== null) {
    await requireActiveOrganizationDepartment(
      boardMembership.departmentId,
      currentUser.organizationId,
    );
    patch.boardMembership = boardMembership;
    patch.isTeamLead = false;
  }

  const update: UpdateFilter<User> = {};
  if (Object.keys(patch).length > 0) update.$set = patch;
  if (
    teamId === null ||
    positionTitle === null ||
    (boardMembership !== undefined && boardMembership !== null) ||
    boardMembership === null
  ) {
    update.$unset = {
      ...(teamId === null ||
      (boardMembership !== undefined && boardMembership !== null)
        ? { teamId: "" }
        : {}),
      ...(boardMembership === null ? { boardMembership: "" } : {}),
      ...(positionTitle === null ? { positionTitle: "" } : {}),
    };
  }
  if (Object.keys(update).length === 0) return;

  await (await users()).updateOne({ _id: target._id }, update);
}
