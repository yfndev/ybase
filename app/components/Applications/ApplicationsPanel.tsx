"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useApplications } from "@/lib/client/applications/hooks/useApplications";
import { useMembers } from "@/lib/client/members/hooks/useMembers";
import type { ApplicationWithFiles } from "@/lib/db/types";
import { ApplicationsTable } from "./ApplicationsTable";
import { ApplicationsToolbar } from "./ApplicationsToolbar";
import {
  ALL_APPLICATIONS,
  type ApplicationFilters,
  filterApplications,
} from "./applicationTable";

interface Props {
  jobPostingId?: string;
}

export function ApplicationsPanel({ jobPostingId }: Props) {
  const router = useRouter();
  const { applications, isLoading } = useApplications(jobPostingId);
  const { members } = useMembers();
  const [filters, setFilters] = useState<ApplicationFilters>({
    search: "",
    status: ALL_APPLICATIONS,
    ownerIds: [],
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
          router.push(`/applications/${application._id}`)
        }
      />
    </div>
  );
}
