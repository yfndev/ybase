import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications, jobPostings } from "../../db/collections";
import type { Application, ApplicationWithFiles } from "../../db/types";

function toApplicationView(
  application: Application,
  jobPostingTitle: string,
): ApplicationWithFiles {
  return {
    ...application,
    jobPostingTitle,
    files: (application.files ?? []).map(
      ({ sourceUrl: _sourceUrl, storageKey: _storageKey, ...file }) => file,
    ),
  };
}

export async function getApplications(): Promise<ApplicationWithFiles[]> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const [records, postings] = await Promise.all([
    (await applications())
      .find({ organizationId: user.organizationId })
      .sort({ _creationTime: -1 })
      .toArray(),
    (await jobPostings())
      .find({ organizationId: user.organizationId })
      .project({ _id: 1, title: 1 })
      .toArray(),
  ]);
  const titles = new Map(
    postings.map((posting) => [posting._id, posting.title]),
  );
  return records.map((application) =>
    toApplicationView(
      application,
      titles.get(application.jobPostingId) ?? "Unbekannte Ausschreibung",
    ),
  );
}

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
  return records.map((application) =>
    toApplicationView(application, posting.title),
  );
}
