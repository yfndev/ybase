import type { ApplicationWithFiles } from "@/lib/db/types";

export async function fetchApplications(
  jobPostingId: string,
): Promise<ApplicationWithFiles[]> {
  const response = await fetch(
    `/api/job-postings/${jobPostingId}/applications`,
  );

  if (!response.ok) {
    throw new Error(
      `Bewerbungen konnten nicht geladen werden (Code ${response.status})`,
    );
  }

  const json = await response.json();
  return json.data as ApplicationWithFiles[];
}
