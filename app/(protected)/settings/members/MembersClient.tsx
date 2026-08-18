"use client";

import { ApplicationsPanel } from "@/components/Applications/ApplicationsPanel";
import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import { useIsAdmin } from "@/lib/hooks/useCurrentUserRole";
import {
  applicationsForStage,
  memberStageCounts,
  memberStatusesForStage,
  membersForStage,
  type MemberStage,
} from "@/lib/members/stages";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ALL, filterMembers, type MemberFilters } from "./filterMembers";
import { MemberDrawer } from "./MemberDrawer";
import { MembersPageHeader } from "./MembersPageHeader";
import { MembersTable } from "./MembersTable";
import { MembersToolbar } from "./MembersToolbar";
import {
  APPLICATION_STAGE_EMPTY_TEXT,
  MEMBER_STAGE_EMPTY_TEXT,
} from "./memberStagePresentation";

export function MembersClient({
  initialStage = "application",
}: {
  initialStage?: MemberStage;
}) {
  const router = useRouter();
  const { applications, isLoading: applicationsLoading } = useApplications();
  const { members, isLoading: membersLoading } = useMembers();
  const { teams } = useTeams();
  const { departments } = useDepartments();
  const isAdmin = useIsAdmin();

  const [stage, setStage] = useState<MemberStage>(initialStage);
  const [filters, setFilters] = useState<MemberFilters>({
    status: "active",
    departmentId: ALL,
    teamId: ALL,
    search: "",
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team._id, team])),
    [teams],
  );
  const departmentsById = useMemo(
    () =>
      new Map(departments.map((department) => [department._id, department])),
    [departments],
  );
  const selectedMember = selectedMemberId
    ? (members.find((member) => member._id === selectedMemberId) ?? null)
    : null;
  const counts = useMemo(
    () => memberStageCounts(applications, members),
    [applications, members],
  );
  const stagedApplications = useMemo(
    () => applicationsForStage(applications, stage),
    [applications, stage],
  );
  const stagedMembers = useMemo(
    () => membersForStage(members, stage),
    [members, stage],
  );
  const memberStatuses = memberStatusesForStage(stage);
  const visibleMembers = memberStatuses.length
    ? filterMembers(
        stagedMembers,
        { ...filters, status: memberStatuses },
        teamsById,
      )
    : [];
  const showsMembers = memberStatuses.length > 0;
  const adminCount = members.filter((member) => member.role === "admin").length;
  const selectedApplicationEmptyText = APPLICATION_STAGE_EMPTY_TEXT[stage];
  const selectedMemberEmptyText = MEMBER_STAGE_EMPTY_TEXT[stage];
  const showsMemberSection = showsMembers && selectedMemberEmptyText;

  return (
    <div className="space-y-6">
      <MembersPageHeader
        stage={stage}
        counts={counts}
        isLoading={applicationsLoading || membersLoading}
        departments={departments}
        teams={teams}
        onMemberCreated={(member) => {
          setStage("onboarding");
          setSelectedMemberId(member._id);
          router.replace("/members?stage=onboarding", { scroll: false });
        }}
        onStageChange={(nextStage) => {
          setStage(nextStage);
          setSelectedMemberId(null);
          router.replace(`/members?stage=${nextStage}`, { scroll: false });
        }}
      />

      {selectedApplicationEmptyText ? (
        <section>
          <ApplicationsPanel
            applications={stagedApplications}
            members={members}
            isLoading={applicationsLoading || membersLoading}
            showStatusFilter={false}
            stage={stage}
            detailBackUrl={`/members?stage=${stage}`}
            emptyTitle={selectedApplicationEmptyText.title}
            emptyDescription={selectedApplicationEmptyText.description}
          />
        </section>
      ) : null}

      {showsMemberSection ? (
        <section className="space-y-4">
          {stage === "archived" ? (
            <h2 className="text-lg font-semibold">Archivierte Mitglieder</h2>
          ) : null}
          {stage === "excluded" ? (
            <div>
              <h2 className="text-lg font-semibold">
                Ausgeschlossene Personen
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Zentrale Liste aller Personen, die aus dem Team ausgeschlossen
                wurden.
              </p>
            </div>
          ) : null}
          <MembersToolbar
            filters={{ ...filters, status: memberStatuses }}
            departments={departments}
            teams={teams}
            onSearchChange={(search) =>
              setFilters((prev) => ({ ...prev, search }))
            }
            onDepartmentChange={(departmentId) =>
              setFilters((prev) => ({ ...prev, departmentId, teamId: ALL }))
            }
            onTeamChange={(teamId) =>
              setFilters((prev) => ({ ...prev, teamId }))
            }
          />

          <MembersTable
            members={visibleMembers}
            isLoading={membersLoading}
            teamsById={teamsById}
            departmentsById={departmentsById}
            emptyTitle={selectedMemberEmptyText.title}
            emptyDescription={selectedMemberEmptyText.description}
            isDepartureEmptyState={
              stage === "offboarding_planned" && stagedMembers.length === 0
            }
            onSelect={(member) => setSelectedMemberId(member._id)}
          />
        </section>
      ) : null}

      {selectedMember && (
        <MemberDrawer
          member={selectedMember}
          teams={teams}
          departments={departments}
          canEditRoles={isAdmin}
          adminCount={adminCount}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
}
