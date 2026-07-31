"use server";

import { z } from "zod";
import { requireAuthenticatedUser } from "../../auth/session";
import { users } from "../../db/collections";
import {
  findLinkableMemberPlatformProfile,
  isEligibleForMemberPlatformLinking,
} from "./linking";
import { persistMemberPlatformProfile } from "./sync";

const profileIdSchema = z.string().trim().min(1).max(120);

export async function confirmMemberPlatformProfile(
  profileId: string,
): Promise<void> {
  const selectedId = profileIdSchema.parse(profileId);
  const member = await requireAuthenticatedUser();
  if (member.memberPlatformUserId) return;
  if (member.memberStatus !== "onboarding") {
    throw new Error("Die Profilverknüpfung ist bereits abgeschlossen.");
  }
  if (!isEligibleForMemberPlatformLinking(member)) {
    throw new Error(
      "Die Profilverknüpfung ist für dieses Konto nicht verfügbar.",
    );
  }

  const [profile, existingClaim] = await Promise.all([
    findLinkableMemberPlatformProfile(selectedId),
    (await users()).findOne(
      {
        _id: { $ne: member._id },
        memberPlatformUserId: selectedId,
      },
      { projection: { _id: 1 } },
    ),
  ]);
  if (existingClaim) {
    throw new Error(
      "Dieses Profil ist bereits verknüpft. Bitte wende dich an People & Culture.",
    );
  }

  const updated = await persistMemberPlatformProfile(member, profile);
  if (updated.memberPlatformUserId !== selectedId) {
    throw new Error(
      "Das Profil konnte nicht verknüpft werden. Bitte wende dich an People & Culture.",
    );
  }
}
