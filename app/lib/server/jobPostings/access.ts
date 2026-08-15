import { recruitingTeamIds } from "../../auth/roles";
import { jobPostings } from "../../db/collections";
import type { JobPosting, UserRole } from "../../db/types";

export interface RecruitingActor {
  organizationId: string;
  role: UserRole;
  teamId?: string;
  secondaryTeamId?: string;
}

export function jobPostingScopeFilter(user: RecruitingActor) {
  const teamIds = recruitingTeamIds(user);
  return teamIds ? { teamId: { $in: teamIds } } : {};
}

export function canManageJobPostingTeam(
  user: RecruitingActor,
  teamId: string,
): boolean {
  const teamIds = recruitingTeamIds(user);
  return !teamIds || teamIds.includes(teamId);
}

export async function requireOwnedJobPosting(
  jobPostingId: string,
  user: RecruitingActor,
): Promise<JobPosting> {
  const posting = await (
    await jobPostings()
  ).findOne({
    _id: jobPostingId,
    organizationId: user.organizationId,
    ...jobPostingScopeFilter(user),
  });
  if (!posting) {
    throw new Error("Access denied");
  }
  return posting;
}
