import { applications } from "../../db/collections";
import type { ApplicationWithFiles } from "../../db/types";
import {
  requireRecruitingApplicationFile,
  requireRecruitingJobPosting,
} from "./access";

export async function getApplicationsForJobPosting(
  jobPostingId: string,
): Promise<ApplicationWithFiles[]> {
  const { user } = await requireRecruitingJobPosting(jobPostingId);
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

export async function queueApplicationFileRetry(
  fileId: string,
): Promise<string> {
  const { application, file } = await requireRecruitingApplicationFile(fileId);
  if (file.status === "rejected") {
    throw new Error("Abgelehnte Dateien können nicht erneut importiert werden");
  }
  if (file.status === "failed") {
    await (
      await applications()
    ).updateOne(
      { _id: application._id },
      {
        $set: {
          "files.$[file].status": "pending",
          "files.$[file].updatedAt": Date.now(),
        },
        $unset: { "files.$[file].error": "" },
      },
      { arrayFilters: [{ "file._id": fileId, "file.status": "failed" }] },
    );
  }
  return application._id;
}
