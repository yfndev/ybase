import {
  type ApplicationDisplayStatus,
  getApplicationDisplayStatus,
} from "../../lib/applications/status";
import type { ApplicationWithFiles } from "@/lib/db/types";

export const ALL_APPLICATIONS = "__all__";
export interface ApplicationFilters {
  search: string;
  status: ApplicationDisplayStatus | typeof ALL_APPLICATIONS;
  ownerIds: string[];
  sortDirection: "asc" | "desc";
}

export function filterApplications(
  applications: ApplicationWithFiles[],
  filters: ApplicationFilters,
): ApplicationWithFiles[] {
  const search = filters.search.trim().toLocaleLowerCase("de");
  const visible = applications.filter((application) => {
    const matchesSearch =
      !search ||
      [
        application.applicantName,
        application.applicantEmail,
        application.jobPostingTitle,
      ].some((value) => value?.toLocaleLowerCase("de").includes(search));
    const matchesStatus =
      filters.status === ALL_APPLICATIONS ||
      getApplicationDisplayStatus(application) === filters.status;
    const matchesOwner =
      filters.ownerIds.length === 0 ||
      application.ownerIds.some((ownerId) =>
        filters.ownerIds.includes(ownerId),
      );
    return matchesSearch && matchesStatus && matchesOwner;
  });

  return visible.toSorted((left, right) =>
    filters.sortDirection === "asc"
      ? left.submittedAt - right.submittedAt
      : right.submittedAt - left.submittedAt,
  );
}
