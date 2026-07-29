import { createHash } from "node:crypto";
import { departments, teams, users } from "../../db/collections";
import type { Department, Team } from "../../db/types";
import { PUBLIC_MEMBER_STATUSES } from "../../members/status";
import {
  boardMemberDto,
  byBoardRole,
  byLeadAndName,
  byName,
  type DirectoryUser,
  memberDto,
  profileName,
} from "./memberMappers";
import type {
  TeamDirectoryData,
  TeamDirectoryDepartment,
  TeamDirectoryFeed,
} from "./types";

function namespacedId(
  organizationId: string,
  entity: "department" | "team" | "member",
  id: string,
): string {
  return `ybase:${organizationId}:${entity}:${id}`;
}

export async function getTeamDirectory(
  organizationId: string,
  publicOrigin: string,
): Promise<TeamDirectoryFeed> {
  const [departmentDocs, teamDocs, memberDocs] = await Promise.all([
    (await departments()).find({ organizationId, isArchived: false }).toArray(),
    (await teams()).find({ organizationId, isArchived: false }).toArray(),
    (await users())
      .find({
        organizationId,
        memberStatus: { $in: [...PUBLIC_MEMBER_STATUSES] },
      })
      .project<DirectoryUser>({
        _id: 1,
        name: 1,
        teamId: 1,
        secondaryTeamId: 1,
        isTeamLead: 1,
        isSecondaryTeamLead: 1,
        boardMembership: 1,
        profileImageStorageKey: 1,
        publicProfileCompletedAt: 1,
      })
      .toArray(),
  ]);

  const activeDepartments = new Map(
    departmentDocs.map((department) => [department._id, department]),
  );
  const activeTeams = teamDocs.filter((team) =>
    activeDepartments.has(team.departmentId),
  );
  const activeTeamIds = new Set(activeTeams.map((team) => team._id));
  const eligibleMembers = memberDocs.filter(
    (member) =>
      Boolean(
        (member.teamId && activeTeamIds.has(member.teamId)) ||
        (member.secondaryTeamId && activeTeamIds.has(member.secondaryTeamId)),
      ) && Boolean(profileName(member)),
  );
  const teamsByDepartment = groupTeams(activeTeams);
  const membersByTeam = groupMembers(eligibleMembers);

  const data: TeamDirectoryData = {
    board: memberDocs
      .flatMap((member) => {
        const boardMember = boardMemberDto(
          member,
          organizationId,
          member.boardMembership
            ? activeDepartments.get(member.boardMembership.departmentId)
            : undefined,
        );
        return boardMember ? [boardMember] : [];
      })
      .sort(byBoardRole),
    departments: departmentDocs
      .map((department) =>
        departmentDto(
          department,
          teamsByDepartment.get(department._id) ?? [],
          membersByTeam,
          organizationId,
          publicOrigin,
        ),
      )
      .filter((department) => department.teams.length > 0)
      .sort(byName),
  };
  const revision = createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");

  return {
    version: "v1",
    generatedAt: new Date().toISOString(),
    revision,
    data,
  };
}

function groupTeams(teamDocs: Team[]): Map<string, Team[]> {
  const result = new Map<string, Team[]>();
  for (const team of teamDocs) {
    const items = result.get(team.departmentId) ?? [];
    items.push(team);
    result.set(team.departmentId, items);
  }
  return result;
}

interface DirectoryMembership {
  member: DirectoryUser;
  isLead: boolean;
}

function groupMembers(
  memberDocs: DirectoryUser[],
): Map<string, DirectoryMembership[]> {
  const result = new Map<string, DirectoryMembership[]>();
  for (const member of memberDocs) {
    const memberships = [
      { teamId: member.teamId, isLead: member.isTeamLead ?? false },
      {
        teamId: member.secondaryTeamId,
        isLead: member.isSecondaryTeamLead ?? false,
      },
    ];
    const seenTeamIds = new Set<string>();
    for (const membership of memberships) {
      if (!membership.teamId || seenTeamIds.has(membership.teamId)) continue;
      seenTeamIds.add(membership.teamId);
      const items = result.get(membership.teamId) ?? [];
      items.push({ member, isLead: membership.isLead });
      result.set(membership.teamId, items);
    }
  }
  return result;
}

function departmentDto(
  department: Department,
  departmentTeams: Team[],
  membersByTeam: Map<string, DirectoryMembership[]>,
  organizationId: string,
  publicOrigin: string,
): TeamDirectoryDepartment {
  return {
    id: namespacedId(organizationId, "department", department._id),
    name: department.name,
    teams: departmentTeams
      .map((team) => ({
        id: namespacedId(organizationId, "team", team._id),
        name: team.name,
        isChapter: team.isChapter ?? false,
        members: (membersByTeam.get(team._id) ?? [])
          .map(({ member, isLead }) =>
            memberDto(
              member,
              organizationId,
              publicOrigin,
              team.isChapter ? false : isLead,
            ),
          )
          .sort(byLeadAndName),
      }))
      .filter((team) => team.members.length > 0)
      .sort(
        (left, right) =>
          Number(left.isChapter) - Number(right.isChapter) ||
          byName(left, right),
      ),
  };
}
