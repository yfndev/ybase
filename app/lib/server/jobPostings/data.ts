import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { jobPostings } from "../../db/collections";
import type { JobPosting } from "../../db/types";

export async function getJobPostings(): Promise<JobPosting[]> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  return (await jobPostings())
    .find({ organizationId: user.organizationId })
    .sort({ _creationTime: -1 })
    .toArray();
}

export async function getJobPostingById(
  jobPostingId: string,
): Promise<JobPosting> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const posting = await (await jobPostings()).findOne({ _id: jobPostingId });
  if (!posting || posting.organizationId !== user.organizationId) {
    throw new Error("No access");
  }
  return posting;
}
