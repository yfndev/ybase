import { requireAuthenticatedUser } from "../../auth/session";
import type { User } from "../../db/types";

export async function requireOnboardingUser(
  allowCompleted = false,
): Promise<User & { organizationId: string }> {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) throw new Error("User has no organization");
  if (
    actor.memberStatus !== "onboarding" &&
    !(allowCompleted && actor.memberStatus === "active")
  ) {
    throw new Error(
      "Das Mitgliedschafts-Onboarding ist bereits abgeschlossen.",
    );
  }
  if (!actor.memberPlatformUserId) {
    throw new Error("Das Member-Profil ist noch nicht verknüpft.");
  }
  return { ...actor, organizationId: actor.organizationId };
}
