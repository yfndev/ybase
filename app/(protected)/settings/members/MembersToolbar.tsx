"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department, Team } from "@/lib/db/types";
import { ALL, type MemberFilters } from "./filterMembers";

interface Props {
  filters: MemberFilters;
  departments: Department[];
  teams: Team[];
  onSearchChange: (search: string) => void;
  onDepartmentChange: (departmentId: string) => void;
  onTeamChange: (teamId: string) => void;
}

export function MembersToolbar({
  filters,
  departments,
  teams,
  onSearchChange,
  onDepartmentChange,
  onTeamChange,
}: Props) {
  const activeDepartments = departments.filter(
    (department) => !department.isArchived,
  );
  const availableTeams = teams.filter(
    (team) =>
      !team.isArchived &&
      (filters.departmentId === ALL ||
        team.departmentId === filters.departmentId),
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={filters.search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Mitglieder durchsuchen…"
        aria-label="Mitglieder durchsuchen"
        className="sm:max-w-xs"
      />
      <Select value={filters.departmentId} onValueChange={onDepartmentChange}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Departments</SelectItem>
          {activeDepartments.map((department) => (
            <SelectItem key={department._id} value={department._id}>
              {department.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.teamId} onValueChange={onTeamChange}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Alle Teams</SelectItem>
          {availableTeams.map((team) => (
            <SelectItem key={team._id} value={team._id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
