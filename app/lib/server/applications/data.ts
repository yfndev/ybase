import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications, jobPostings } from "../../db/collections";
import type { Application } from "../../db/types";

export async function getApplicationsForJobPosting(
  jobPostingId: string,
): Promise<Application[]> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const posting = await (await jobPostings()).findOne({ _id: jobPostingId });
  if (!posting || posting.organizationId !== user.organizationId) {
    throw new Error("No access");
  }

  return (await applications())
    .find({ organizationId: user.organizationId, jobPostingId })
    .sort({ _creationTime: -1 })
    .toArray();
}
