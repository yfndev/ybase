import type { Application } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchApplications } from "../requests/fetchApplications";

export function useApplications(jobPostingId: string, enabled = true) {
  const result = useQuery<Application[]>({
    queryKey: ["applications", jobPostingId],
    queryFn: () => fetchApplications(jobPostingId),
    enabled,
  });

  return {
    applications: result.data ?? [],
    isLoading: result.isLoading,
  };
}
