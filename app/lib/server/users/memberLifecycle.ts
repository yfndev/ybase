import type { MemberStatus, TeamOnboardingStatus, User } from "../../db/types";

type MemberStatusPatch = Partial<
  Pick<User, "memberStatus" | "onboardedAt" | "offboardedAt">
>;

type TeamOnboardingPatch = Partial<
  Pick<User, "teamOnboardingStatus" | "teamOnboardedAt">
>;

export function memberStatusPatch(
  current: MemberStatus | undefined,
  next: MemberStatus,
  now: number,
): MemberStatusPatch {
  const patch: MemberStatusPatch = { memberStatus: next };
  if (next === current) return patch;
  if (next === "active") patch.onboardedAt = now;
  if (next === "offboarded") patch.offboardedAt = now;
  return patch;
}

export function teamOnboardingPatch(
  current: TeamOnboardingStatus | undefined,
  next: TeamOnboardingStatus,
  now: number,
): TeamOnboardingPatch {
  const patch: TeamOnboardingPatch = { teamOnboardingStatus: next };
  if (next !== current && next === "completed") patch.teamOnboardedAt = now;
  return patch;
}
