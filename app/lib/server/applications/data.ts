import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications, jobPostings } from "../../db/collections";
import type { ApplicationWithFiles } from "../../db/types";

export async function getApplicationsForJobPosting(
  jobPostingId: string,
): Promise<ApplicationWithFiles[]> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const posting = await (await jobPostings()).findOne({ _id: jobPostingId });
  if (!posting || posting.organizationId !== user.organizationId) {
    throw new Error("No access");
  }

  const records = await (await applications())
    .find({ organizationId: user.organizationId, jobPostingId })
    .sort({ _creationTime: -1 })
    .toArray();
  return records.map((application) => ({
    ...application,
    files: (application.files ?? []).map(
      ({ sourceUrl: _sourceUrl, storageKey: _storageKey, ...file }) => file,
    ),
  }));
}
