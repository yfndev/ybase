"use server";

import type { UpdateFilter } from "mongodb";
import { z } from "zod";
import { requireUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { BoardMembership, User } from "../../db/types";
import { bankDetailsSchema } from "../bankDetails";
import {
  loadManagedMember,
  requireActiveOrganizationDepartment,
  requireActiveOrganizationTeam,
} from "./access";
import { phoneSchema, privateEmailSchema } from "./contactDetails";

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
  privateEmail?: string | null;
  phone?: string | null;
  teamId?: string | null;
  secondaryTeamId?: string | null;
  isTeamLead?: boolean;
  isSecondaryTeamLead?: boolean;
  boardMembership?: BoardMembership | null;
}): Promise<void> {
  const {
    userId,
    privateEmail,
    phone,
    teamId,
    secondaryTeamId,
    isTeamLead,
    isSecondaryTeamLead,
    boardMembership,
  } = z
    .object({
      userId: z.string(),
      privateEmail: privateEmailSchema.nullable().optional(),
      phone: phoneSchema.nullable().optional(),
      teamId: z.string().trim().min(1).nullable().optional(),
      secondaryTeamId: z.string().trim().min(1).nullable().optional(),
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
  const joinsPrimaryTeam = typeof teamId === "string" || isTeamLead === true;
  if (hasBoardAssignment && joinsPrimaryTeam) {
    throw new Error(
      "Vorstandsmitglieder haben kein Hauptteam. Nutze das weitere Team.",
    );
  }
  const nextTeamId =
    hasBoardAssignment || teamId === null
      ? undefined
      : (teamId ?? target.teamId);
  const nextSecondaryTeamId =
    secondaryTeamId === undefined
      ? target.secondaryTeamId
      : (secondaryTeamId ?? undefined);
  const nextIsTeamLead = hasBoardAssignment
    ? false
    : (isTeamLead ?? target.isTeamLead ?? false);
  const nextIsSecondaryTeamLead =
    secondaryTeamId === null
      ? false
      : (isSecondaryTeamLead ?? target.isSecondaryTeamLead ?? false);
  if (
    !hasBoardAssignment &&
    nextTeamId &&
    nextSecondaryTeamId &&
    nextTeamId === nextSecondaryTeamId
  ) {
    throw new Error("Hauptteam und weiteres Team müssen unterschiedlich sein.");
  }
  if (!hasBoardAssignment && nextIsTeamLead && !nextTeamId) {
    throw new Error("Ein Lead benötigt ein zugeordnetes Hauptteam.");
  }
  if (nextIsSecondaryTeamLead && !nextSecondaryTeamId) {
    throw new Error("Ein Lead benötigt ein zugeordnetes weiteres Team.");
  }
  const [nextTeam, nextSecondaryTeam] = await Promise.all([
    nextTeamId
      ? requireActiveOrganizationTeam(nextTeamId, currentUser.organizationId)
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
  const patch: Partial<
    Pick<
      User,
      | "privateEmail"
      | "phone"
      | "teamId"
      | "secondaryTeamId"
      | "isTeamLead"
      | "isSecondaryTeamLead"
      | "boardMembership"
    >
  > = {};
  if (privateEmail !== undefined && privateEmail !== null) {
    patch.privateEmail = privateEmail;
  }
  if (phone !== undefined && phone !== null) patch.phone = phone;
  if (teamId !== undefined && teamId !== null) {
    patch.teamId = teamId;
  }
  if (secondaryTeamId !== undefined && secondaryTeamId !== null) {
    patch.secondaryTeamId = secondaryTeamId;
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
  }

  const update: UpdateFilter<User> = {};
  if (Object.keys(patch).length > 0) update.$set = patch;
  if (
    teamId === null ||
    privateEmail === null ||
    phone === null ||
    secondaryTeamId === null ||
    (boardMembership !== undefined && boardMembership !== null) ||
    boardMembership === null
  ) {
    update.$unset = {
      ...(teamId === null ||
      (boardMembership !== undefined && boardMembership !== null)
        ? { teamId: "" }
        : {}),
      ...(privateEmail === null ? { privateEmail: "" } : {}),
      ...(phone === null ? { phone: "" } : {}),
      ...(secondaryTeamId === null ? { secondaryTeamId: "" } : {}),
      ...(boardMembership === null ? { boardMembership: "" } : {}),
    };
  }
  if (Object.keys(update).length === 0) return;

  await (await users()).updateOne({ _id: target._id }, update);
}
