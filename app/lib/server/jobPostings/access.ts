import { jobPostings } from "../../db/collections";
import type { JobPosting } from "../../db/types";

export async function requireOwnedJobPosting(
  jobPostingId: string,
  organizationId: string,
): Promise<JobPosting> {
  const posting = await (
    await jobPostings()
  ).findOne({
    _id: jobPostingId,
    organizationId,
  });
  if (!posting) {
    throw new Error("Access denied");
  }
  return posting;
}
