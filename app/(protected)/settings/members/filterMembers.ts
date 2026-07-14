import type { MemberStatus, Team, User } from "@/lib/db/types";

export const ALL = "all";

export interface MemberFilters {
  status: MemberStatus;
  departmentId: string;
  teamId: string;
  search: string;
}

export function memberStatusOf(member: User): MemberStatus {
  return member.memberStatus ?? "onboarding";
}

export function departmentIdOf(
  member: User,
  teamsById: Map<string, Team>,
): string | undefined {
  if (!member.teamId) return undefined;
  return teamsById.get(member.teamId)?.departmentId;
}

function matchesSearch(member: User, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  const haystack =
    `${member.name ?? ""} ${member.email ?? ""} ${member.positionTitle ?? ""}`.toLowerCase();
  return haystack.includes(needle);
}

export function filterMembers(
  members: User[],
  filters: MemberFilters,
  teamsById: Map<string, Team>,
): User[] {
  return members.filter((member) => {
    if (memberStatusOf(member) !== filters.status) return false;
    if (
      filters.departmentId !== ALL &&
      departmentIdOf(member, teamsById) !== filters.departmentId
    )
      return false;
    if (filters.teamId !== ALL && member.teamId !== filters.teamId)
      return false;
    return matchesSearch(member, filters.search);
  });
}
