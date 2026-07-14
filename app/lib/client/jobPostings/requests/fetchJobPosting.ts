import type { JobPosting } from "@/lib/db/types";

export async function fetchJobPosting(id: string): Promise<JobPosting> {
  const response = await fetch(`/api/job-postings/${id}`);

  if (!response.ok) {
    throw new Error(
      `Ausschreibung konnte nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as JobPosting;
}
