"use client";

import { ApplicationsPanel } from "@/components/Applications/ApplicationsPanel";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { useDepartments } from "@/lib/client/departments/hooks/useDepartments";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import { useTeams } from "@/lib/client/teams/hooks/useTeams";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
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
import { AcceptedApplicantDrawer } from "./AcceptedApplicantDrawer";
import { ALL, filterMembers, type MemberFilters } from "./filterMembers";
import { MemberDrawer } from "./MemberDrawer";
import { MemberStageTabs } from "./MemberStageTabs";
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
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [selectedAcceptedApplication, setSelectedAcceptedApplication] =
    useState<ApplicationWithFiles | null>(null);

  const teamsById = useMemo(
    () => new Map(teams.map((team) => [team._id, team])),
    [teams],
  );
  const departmentsById = useMemo(
    () =>
      new Map(departments.map((department) => [department._id, department])),
    [departments],
  );
  const memberStatusesById = useMemo(
    () => new Map(members.map((member) => [member._id, member.memberStatus])),
    [members],
  );
  const counts = useMemo(
    () => memberStageCounts(applications, members),
    [applications, members],
  );
  const stagedApplications = useMemo(
    () => applicationsForStage(applications, stage, memberStatusesById),
    [applications, memberStatusesById, stage],
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

  return (
    <div className="space-y-6">
      <PageHeader title="Mitglieder" />

      <MemberStageTabs
        stage={stage}
        counts={counts}
        isLoading={applicationsLoading || membersLoading}
        onChange={(nextStage) => {
          setStage(nextStage);
          setSelectedMember(null);
          setSelectedAcceptedApplication(null);
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
            onSelect={
              stage === "onboarding"
                ? (application) => {
                    const member = members.find(
                      (entry) =>
                        entry._id === application.onboardingUserId ||
                        entry.applicationId === application._id,
                    );
                    setSelectedAcceptedApplication(member ? null : application);
                    setSelectedMember(member ?? null);
                  }
                : undefined
            }
          />
        </section>
      ) : null}

      {showsMembers && selectedMemberEmptyText ? (
        <section className="space-y-4">
          {stage === "archived" ? (
            <h2 className="text-lg font-semibold">Archivierte Mitglieder</h2>
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
            onSelect={setSelectedMember}
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
          onClose={() => setSelectedMember(null)}
        />
      )}
      {selectedAcceptedApplication ? (
        <AcceptedApplicantDrawer
          application={selectedAcceptedApplication}
          onClose={() => setSelectedAcceptedApplication(null)}
        />
      ) : null}
    </div>
  );
}
