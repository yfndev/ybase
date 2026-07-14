import type { JobPosting } from "@/lib/db/types";
import { useQuery } from "@tanstack/react-query";

import { fetchJobPostings } from "../requests/fetchJobPostings";

export function useJobPostings() {
  const result = useQuery<JobPosting[]>({
    queryKey: ["jobPostings"],
    queryFn: fetchJobPostings,
  });

  return { jobPostings: result.data ?? [], isLoading: result.isLoading };
}
