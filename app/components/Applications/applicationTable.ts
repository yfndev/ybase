import type { ApplicationStatus, ApplicationWithFiles } from "@/lib/db/types";

export const ALL_APPLICATIONS = "__all__";
export const UNASSIGNED_APPLICATIONS = "__unassigned__";

export interface ApplicationFilters {
  search: string;
  status: ApplicationStatus | typeof ALL_APPLICATIONS;
  ownerId: string;
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
      application.status === filters.status;
    const matchesOwner =
      filters.ownerId === ALL_APPLICATIONS ||
      (filters.ownerId === UNASSIGNED_APPLICATIONS
        ? !application.ownerId
        : application.ownerId === filters.ownerId);
    return matchesSearch && matchesStatus && matchesOwner;
  });

  return visible.toSorted((left, right) =>
    filters.sortDirection === "asc"
      ? left.submittedAt - right.submittedAt
      : right.submittedAt - left.submittedAt,
  );
}
