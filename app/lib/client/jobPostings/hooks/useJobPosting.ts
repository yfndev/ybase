import type { JobPosting } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchJobPosting } from "../requests/fetchJobPosting";

export function useJobPosting(id: string) {
  const result = useQuery<JobPosting>({
    queryKey: ["jobPostings", id],
    queryFn: () => fetchJobPosting(id),
  });

  return { jobPosting: result.data, isLoading: result.isLoading };
}
