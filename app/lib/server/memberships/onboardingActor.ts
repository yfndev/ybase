import { requireAuthenticatedUser } from "../../auth/session";
import type { StoredMemberStatus, User } from "../../db/types";

const ONBOARDING_STATUSES: StoredMemberStatus[] = [
  "onboarding",
  "getting_to_know",
];

export async function requireOnboardingUser(
  allowCompleted = false,
): Promise<User & { organizationId: string }> {
  const actor = await requireAuthenticatedUser();
  if (!actor.organizationId) throw new Error("User has no organization");
  const isOnboarding =
    ONBOARDING_STATUSES.includes(actor.memberStatus) ||
    (allowCompleted && actor.memberStatus === "active");
  if (!isOnboarding) {
    throw new Error(
      "Das Mitgliedschafts-Onboarding ist bereits abgeschlossen.",
    );
  }
  if (!actor.memberPlatformUserId) {
    throw new Error("Das Member-Profil ist noch nicht verknüpft.");
  }
  return { ...actor, organizationId: actor.organizationId };
}
