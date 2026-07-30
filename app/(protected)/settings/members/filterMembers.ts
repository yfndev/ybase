import type { MemberStatus, Team, User } from "@/lib/db/types";

export const ALL = "all";

export interface MemberFilters {
  status: MemberStatus | readonly MemberStatus[];
  departmentId: string;
  teamId: string;
  search: string;
}

export function departmentIdsOf(
  member: User,
  teamsById: Map<string, Team>,
): string[] {
  if (member.boardMembership) return [member.boardMembership.departmentId];

  const departmentIds: string[] = [];
  for (const teamId of [member.teamId, member.secondaryTeamId]) {
    if (!teamId) continue;
    const departmentId = teamsById.get(teamId)?.departmentId;
    if (departmentId && !departmentIds.includes(departmentId)) {
      departmentIds.push(departmentId);
    }
  }
  return departmentIds;
}

function matchesSearch(member: User, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  const haystack = `${member.name ?? ""} ${member.email ?? ""}`.toLowerCase();
  return haystack.includes(needle);
}

export function filterMembers(
  members: User[],
  filters: MemberFilters,
  teamsById: Map<string, Team>,
): User[] {
  const statuses = Array.isArray(filters.status)
    ? filters.status
    : [filters.status];
  return members.filter((member) => {
    if (!statuses.includes(member.memberStatus)) return false;
    if (
      filters.departmentId !== ALL &&
      !departmentIdsOf(member, teamsById).includes(filters.departmentId)
    )
      return false;
    if (
      filters.teamId !== ALL &&
      member.teamId !== filters.teamId &&
      member.secondaryTeamId !== filters.teamId
    )
      return false;
    return matchesSearch(member, filters.search);
  });
}
