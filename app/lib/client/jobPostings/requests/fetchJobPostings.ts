import type { JobPosting } from "@/lib/db/types";

export async function fetchJobPostings(): Promise<JobPosting[]> {
  const response = await fetch("/api/job-postings");

  if (!response.ok) {
    throw new Error(
      `Ausschreibungen konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as JobPosting[];
}
