import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications, jobPostings } from "../../db/collections";
import type { ApplicationFileStatus } from "../../db/types";

export async function loadOwnedApplication(applicationId: string) {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const application = await (
    await applications()
  ).findOne({
    _id: applicationId,
    organizationId: user.organizationId,
  });
  if (!application) throw new Error("Bewerbung nicht gefunden");
  return { user, application };
}

export async function requireRecruitingJobPosting(jobPostingId: string) {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const posting = await (
    await jobPostings()
  ).findOne({
    _id: jobPostingId,
    organizationId: user.organizationId,
  });
  if (!posting) throw new Error("No access");
  return { user, posting };
}

export async function requireRecruitingApplicationFile(
  fileId: string,
  allowedStatuses?: ApplicationFileStatus[],
) {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const application = await (
    await applications()
  ).findOne({
    organizationId: user.organizationId,
    files: {
      $elemMatch: {
        _id: fileId,
        ...(allowedStatuses ? { status: { $in: allowedStatuses } } : {}),
      },
    },
  });
  const file = application?.files.find((candidate) => candidate._id === fileId);
  if (!application || !file) {
    throw new Error(
      allowedStatuses ? "Datei nicht verfügbar" : "Datei nicht gefunden",
    );
  }
  return { application, file };
}
