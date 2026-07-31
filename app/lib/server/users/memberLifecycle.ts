import type {
  MemberStatus,
  StoredMemberStatus,
  TeamOnboardingStatus,
  User,
} from "../../db/types";

type MemberStatusPatch = Partial<
  Pick<
    User,
    | "memberStatus"
    | "onboardedAt"
    | "offboardingPlannedAt"
    | "offboardingStartedAt"
    | "archivedAt"
    | "excludedAt"
  >
>;

type TeamOnboardingPatch = Partial<
  Pick<User, "teamOnboardingStatus" | "teamOnboardedAt">
>;

export function memberStatusPatch(
  current: StoredMemberStatus,
  next: MemberStatus,
  now: number,
): MemberStatusPatch {
  const patch: MemberStatusPatch = { memberStatus: next };
  if (next === current) return patch;
  if (next === "active") patch.onboardedAt = now;
  if (next === "offboarding_planned") patch.offboardingPlannedAt = now;
  if (next === "offboarding") patch.offboardingStartedAt = now;
  if (next === "archived") patch.archivedAt = now;
  if (next === "excluded") patch.excludedAt = now;
  return patch;
}

export function teamOnboardingPatch(
  current: TeamOnboardingStatus,
  next: TeamOnboardingStatus,
  now: number,
): TeamOnboardingPatch {
  const patch: TeamOnboardingPatch = { teamOnboardingStatus: next };
  if (next !== current && next === "completed") patch.teamOnboardedAt = now;
  return patch;
}
