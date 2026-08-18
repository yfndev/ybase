"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import type { ApplicationWithFiles, User } from "@/lib/db/types";
import type { MemberStage } from "@/lib/members/stages";
import { isUnavailableMemberStatus } from "@/lib/members/status";
import { ApplicationsTable } from "./ApplicationsTable/ApplicationsTable";
import { ApplicationsToolbar } from "./ApplicationsToolbar";
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  filterApplications,
} from "./applicationTable";

interface Props {
  jobPostingId?: string;
  applications?: ApplicationWithFiles[];
  members?: User[];
  isLoading?: boolean;
  showStatusFilter?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  detailBackUrl?: string;
  stage?: MemberStage;
  onSelect?: (application: ApplicationWithFiles) => void;
}

export function ApplicationsPanel({
  jobPostingId,
  applications: controlledApplications,
  members: controlledMembers,
  isLoading: controlledIsLoading,
  showStatusFilter = true,
  emptyTitle,
  emptyDescription,
  detailBackUrl,
  stage,
  onSelect,
}: Props) {
  const router = useRouter();
  const applicationsQuery = useApplications(
    jobPostingId,
    controlledApplications === undefined,
  );
  const membersQuery = useMembers(controlledMembers === undefined);
  const applications = controlledApplications ?? applicationsQuery.applications;
  const members = controlledMembers ?? membersQuery.members;
  const isLoading =
    controlledIsLoading ??
    (applicationsQuery.isLoading || membersQuery.isLoading);
  const [filters, setFilters] = useState<ApplicationFilters>({
    search: "",
    status: ALL_APPLICATIONS,
    ownerIds: [],
    sortDirection: "desc",
  });
  const owners = useMemo(
    () =>
      members.filter(
        (member) => !isUnavailableMemberStatus(member.memberStatus),
      ),
    [members],
  );
  const ownersById = useMemo(
    () => new Map(members.map((member) => [member._id, member])),
    [members],
  );
  const visibleApplications = filterApplications(applications, filters);

  return (
    <div className="space-y-4">
      <ApplicationsToolbar
        filters={filters}
        owners={owners}
        showOwnerFilter={!jobPostingId}
        showStatusFilter={showStatusFilter}
        onChange={(patch) =>
          setFilters((current) => ({ ...current, ...patch }))
        }
      />
      <ApplicationsTable
        applications={visibleApplications}
        ownersById={ownersById}
        isLoading={isLoading}
        showJobPosting={!jobPostingId}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        stage={stage}
        onSelect={(application: ApplicationWithFiles) => {
          if (onSelect) {
            onSelect(application);
            return;
          }
          router.push(
            `/applications/${application._id}?returnTo=${encodeURIComponent(
              detailBackUrl ??
                (jobPostingId ? `/recruiting/${jobPostingId}` : "/members"),
            )}`,
          );
        }}
      />
    </div>
  );
}
