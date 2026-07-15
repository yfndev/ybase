"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { User } from "../../db/types";
import { bankDetailsSchema } from "../bankDetails";
import { loadManagedMember, requireActiveOrganizationTeam } from "./access";

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
    await requireActiveOrganizationTeam(teamId, currentUser.organizationId);
    patch.teamId = teamId;
  }
  if (positionTitle !== undefined) patch.positionTitle = positionTitle;
  if (Object.keys(patch).length === 0) return;
  await (await users()).updateOne({ _id: target._id }, { $set: patch });
}
