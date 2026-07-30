import type { Department, Team } from "@/lib/db/types";

export function memberOrganizationState(
  teams: Team[],
  departments: Department[],
  teamId: string,
) {
  const activeTeams = teams.filter((team) => !team.isArchived);
  const activeDepartments = departments.filter(
    (department) => !department.isArchived,
  );
  const selectedTeam = activeTeams.find((team) => team._id === teamId);
  return {
    teamOptions: activeTeams.map((team) => ({
      value: team._id,
      label: team.name,
    })),
    departmentOptions: activeDepartments.map((department) => ({
      value: department._id,
      label: department.name,
    })),
    department: selectedTeam
      ? departments.find((entry) => entry._id === selectedTeam.departmentId)
      : undefined,
    chapterTeamIds: new Set(
      activeTeams.filter((team) => team.isChapter).map((team) => team._id),
    ),
  };
}
