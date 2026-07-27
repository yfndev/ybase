import { createHash } from "node:crypto";
import { departments, teams, users } from "../../db/collections";
import type { Department, Team, User } from "../../db/types";
import type {
  TeamDirectoryBoardMemberV1,
  TeamDirectoryDataV1,
  TeamDirectoryDepartmentV1,
  TeamDirectoryFeedV1,
  TeamDirectoryMemberV1,
} from "./types";

type DirectoryUser = Pick<
  User,
  "_id" | "name" | "teamId" | "positionTitle" | "publicTeamProfile"
>;

const byOrderAndName = (
  left: { sortOrder: number; name: string },
  right: { sortOrder: number; name: string },
) =>
  left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "de");

function publicName(user: DirectoryUser): string {
  return user.publicTeamProfile?.displayName?.trim() || user.name?.trim() || "";
}

function publicRole(user: DirectoryUser): string {
  return (
    user.publicTeamProfile?.role?.trim() || user.positionTitle?.trim() || ""
  );
}

function namespacedId(
  organizationId: string,
  entity: "department" | "team" | "member",
  id: string,
): string {
  return `ybase:${organizationId}:${entity}:${id}`;
}

function memberDto(
  user: DirectoryUser,
  organizationId: string,
): TeamDirectoryMemberV1 {
  return {
    id: namespacedId(organizationId, "member", user._id),
    name: publicName(user),
    role: publicRole(user),
    isLead: user.publicTeamProfile?.isTeamLead ?? false,
    sortOrder: user.publicTeamProfile?.sortOrder ?? 100,
  };
}

function boardDto(
  user: DirectoryUser,
  organizationId: string,
): TeamDirectoryBoardMemberV1 | null {
  const board = user.publicTeamProfile?.board;
  if (!board) return null;
  return {
    id: namespacedId(organizationId, "member", user._id),
    name: publicName(user),
    role: board.role,
    isChair: board.isChair,
    icon: board.icon,
    sortOrder: board.sortOrder,
  };
}

export async function getTeamDirectoryV1(
  organizationId: string,
): Promise<TeamDirectoryFeedV1> {
  const [departmentDocs, teamDocs, memberDocs] = await Promise.all([
    (await departments()).find({ organizationId, isArchived: false }).toArray(),
    (await teams()).find({ organizationId, isArchived: false }).toArray(),
    (await users())
      .find({
        organizationId,
        memberStatus: "active",
        "publicTeamProfile.isPublished": true,
      })
      .project<DirectoryUser>({
        _id: 1,
        name: 1,
        teamId: 1,
        positionTitle: 1,
        publicTeamProfile: 1,
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
      Boolean(member.teamId && activeTeamIds.has(member.teamId)) &&
      Boolean(publicName(member)) &&
      Boolean(publicRole(member)),
  );
  const teamsByDepartment = groupTeams(activeTeams);
  const membersByTeam = groupMembers(eligibleMembers);

  const data: TeamDirectoryDataV1 = {
    board: eligibleMembers
      .flatMap((member) => {
        const item = boardDto(member, organizationId);
        return item ? [item] : [];
      })
      .sort(byOrderAndName),
    departments: departmentDocs
      .map((department) =>
        departmentDto(
          department,
          teamsByDepartment.get(department._id) ?? [],
          membersByTeam,
          organizationId,
        ),
      )
      .filter((department) => department.teams.length > 0)
      .sort(byOrderAndName),
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

function groupMembers(
  memberDocs: DirectoryUser[],
): Map<string, DirectoryUser[]> {
  const result = new Map<string, DirectoryUser[]>();
  for (const member of memberDocs) {
    if (!member.teamId) continue;
    const items = result.get(member.teamId) ?? [];
    items.push(member);
    result.set(member.teamId, items);
  }
  return result;
}

function departmentDto(
  department: Department,
  departmentTeams: Team[],
  membersByTeam: Map<string, DirectoryUser[]>,
  organizationId: string,
): TeamDirectoryDepartmentV1 {
  return {
    id: namespacedId(organizationId, "department", department._id),
    name: department.name,
    sortOrder: department.websiteSortOrder ?? 100,
    teams: departmentTeams
      .map((team) => ({
        id: namespacedId(organizationId, "team", team._id),
        name: team.name,
        sortOrder: team.websiteSortOrder ?? 100,
        members: (membersByTeam.get(team._id) ?? [])
          .map((member) => memberDto(member, organizationId))
          .sort(byOrderAndName),
      }))
      .filter((team) => team.members.length > 0)
      .sort(byOrderAndName),
  };
}
