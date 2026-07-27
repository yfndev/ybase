"use server";

import { z } from "zod";
import { users } from "../../db/collections";
import type { PublicTeamProfile } from "../../db/types";
import { addLog } from "../logs";
import { loadManagedMember } from "./access";

const optionalText = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((value) => value || undefined);

const publicTeamProfileSchema = z.object({
  userId: z.string(),
  displayName: optionalText,
  role: optionalText,
  isTeamLead: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  board: z
    .object({
      role: z.string().trim().min(1).max(100),
      isChair: z.boolean(),
      sortOrder: z.number().int().min(0).max(9999),
    })
    .optional(),
});

export type PublicTeamProfileInput = z.input<typeof publicTeamProfileSchema>;

export async function updatePublicTeamProfile(
  input: PublicTeamProfileInput,
): Promise<void> {
  const parsed = publicTeamProfileSchema.parse(input);
  const { currentUser, target } = await loadManagedMember(parsed.userId);

  const publicTeamProfile: PublicTeamProfile = {
    isTeamLead: parsed.isTeamLead,
    sortOrder: parsed.sortOrder,
    ...(parsed.displayName ? { displayName: parsed.displayName } : {}),
    ...(parsed.role ? { role: parsed.role } : {}),
    ...(parsed.board ? { board: parsed.board } : {}),
  };

  await (
    await users()
  ).updateOne({ _id: target._id }, { $set: { publicTeamProfile } });
  await addLog(
    currentUser.organizationId,
    currentUser._id,
    "member.public_team_profile_update",
    target._id,
    "Darstellung auf der Team-Seite aktualisiert",
  );
}
