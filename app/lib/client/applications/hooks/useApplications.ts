import type { ApplicationWithFiles } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchApplications } from "../requests/fetchApplications";

export function useApplications(jobPostingId?: string, enabled = true) {
  const result = useQuery<ApplicationWithFiles[]>({
    queryKey: ["applications", jobPostingId ?? "all"],
    queryFn: () => fetchApplications(jobPostingId),
    enabled,
    refetchInterval: (query) =>
      query.state.data?.some((application) =>
        application.files.some((file) =>
          ["pending", "importing"].includes(file.status),
        ),
      )
        ? 1_500
        : false,
  });

  return {
    applications: result.data ?? [],
    isLoading: result.isLoading,
    refetch: result.refetch,
  };
}
