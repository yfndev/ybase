"use client";

import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { useMemo, useState } from "react";
import { ApplicationDrawer } from "./ApplicationDrawer";
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  filterApplications,
} from "./applicationTable";
import { ApplicationsTable } from "./ApplicationsTable";
import { ApplicationsToolbar } from "./ApplicationsToolbar";

interface Props {
  jobPostingId?: string;
}

export function ApplicationsPanel({ jobPostingId }: Props) {
  const { applications, isLoading, refetch } = useApplications(jobPostingId);
  const { members } = useMembers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ApplicationFilters>({
    search: "",
    status: ALL_APPLICATIONS,
    ownerId: ALL_APPLICATIONS,
    sortDirection: "desc",
  });
  const owners = useMemo(
    () => members.filter((member) => member.memberStatus !== "offboarded"),
    [members],
  );
  const ownersById = useMemo(
    () => new Map(members.map((member) => [member._id, member])),
    [members],
  );
  const visibleApplications = filterApplications(applications, filters);
  const selectedApplication = applications.find(
    (application) => application._id === selectedId,
  );

  return (
    <div className="space-y-4">
      <ApplicationsToolbar
        filters={filters}
        owners={owners}
        onChange={(patch) =>
          setFilters((current) => ({ ...current, ...patch }))
        }
      />
      <ApplicationsTable
        applications={visibleApplications}
        ownersById={ownersById}
        isLoading={isLoading}
        showJobPosting={!jobPostingId}
        sortDirection={filters.sortDirection}
        onSort={() =>
          setFilters((current) => ({
            ...current,
            sortDirection: current.sortDirection === "desc" ? "asc" : "desc",
          }))
        }
        onSelect={(application: ApplicationWithFiles) =>
          setSelectedId(application._id)
        }
      />
      {selectedApplication ? (
        <ApplicationDrawer
          key={`${selectedApplication._id}-${selectedApplication.updatedAt ?? 0}-${selectedApplication.status}`}
          application={selectedApplication}
          owners={owners}
          ownersById={ownersById}
          onClose={() => setSelectedId(null)}
          onFilesChanged={refetch}
        />
      ) : null}
    </div>
  );
}
