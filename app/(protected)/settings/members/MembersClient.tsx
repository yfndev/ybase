"use client";

import { PageHeader } from "@/components/Layout/PageHeader";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import type { User } from "@/lib/db/types";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import { useMemo, useState } from "react";
import { ALL, filterMembers, type MemberFilters } from "./filterMembers";
import { MemberDrawer } from "./MemberDrawer";
import { MembersTable } from "./MembersTable";
import { MembersToolbar } from "./MembersToolbar";

export function MembersClient() {
  const { members, isLoading } = useMembers();
  const { teams } = useTeams();
  const { departments } = useDepartments();
  const isAdmin = useIsAdmin();

  const [filters, setFilters] = useState<MemberFilters>({
    status: "active",
    departmentId: ALL,
    teamId: ALL,
    search: "",
  });
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team._id, team])),
    [teams],
  );
  const departmentsById = useMemo(
    () =>
      new Map(departments.map((department) => [department._id, department])),
    [departments],
  );

  const visibleMembers = filterMembers(members, filters, teamsById);
  const adminCount = members.filter((member) => member.role === "admin").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Teammitglieder" />

      <MembersToolbar
        filters={filters}
        departments={departments}
        teams={teams}
        onStatusChange={(status) => setFilters((prev) => ({ ...prev, status }))}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onDepartmentChange={(departmentId) =>
          setFilters((prev) => ({ ...prev, departmentId, teamId: ALL }))
        }
        onTeamChange={(teamId) => setFilters((prev) => ({ ...prev, teamId }))}
      />

      <MembersTable
        members={visibleMembers}
        isLoading={isLoading}
        teamsById={teamsById}
        departmentsById={departmentsById}
        onSelect={setSelectedMember}
      />

      {selectedMember && (
        <MemberDrawer
          key={selectedMember._id}
          member={selectedMember}
          teams={teams}
          departments={departments}
          canEditRoles={isAdmin}
          adminCount={adminCount}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
