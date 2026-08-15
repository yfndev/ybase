"use client";

import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import { useRecruitingTeamIds } from "./useCurrentUserRole";

export function useRecruitingTeamOptions() {
  const { departments } = useDepartments();
  const { teams } = useTeams();
  const allowedTeamIds = useRecruitingTeamIds();

  if (!allowedTeamIds) return { departments, teams };

  const allowedTeams = teams.filter((team) =>
    allowedTeamIds.includes(team._id),
  );
  return {
    departments: departments.filter((department) =>
      allowedTeams.some((team) => team.departmentId === department._id),
    ),
    teams: allowedTeams,
  };
}
