import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import { useMemo } from "react";

export interface TeamInfo {
  teamName: string;
  departmentName: string;
}

export function useTeamDirectory() {
  const { teams } = useTeams();
  const { teams: archivedTeams } = useTeams(true);
  const { departments } = useDepartments();
  const { departments: archivedDepartments } = useDepartments(true);

  const lookup = useMemo(() => {
    const departmentNames = new Map<string, string>();
    for (const department of [...departments, ...archivedDepartments]) {
      departmentNames.set(department._id, department.name);
    }
    const map = new Map<string, TeamInfo>();
    for (const team of [...teams, ...archivedTeams]) {
      map.set(team._id, {
        teamName: team.name,
        departmentName: departmentNames.get(team.departmentId) ?? "–",
      });
    }
    return map;
  }, [teams, archivedTeams, departments, archivedDepartments]);

  return { teams, lookup };
}
