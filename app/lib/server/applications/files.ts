import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { applications } from "../../db/collections";
import { presignNamedDownload } from "../../s3/storage";

export async function getApplicationFileDownloadUrl(
  fileId: string,
): Promise<string> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const application = await (
    await applications()
  ).findOne({
    organizationId: user.organizationId,
    files: { $elemMatch: { _id: fileId, status: "imported" } },
  });
  const file = application?.files.find((candidate) => candidate._id === fileId);
  if (!file?.storageKey) throw new Error("Datei nicht verfügbar");
  return presignNamedDownload(file.storageKey, file.fileName);
}

export async function queueApplicationFileRetry(
  fileId: string,
): Promise<string> {
  const user = await requirePermission(USER_PERMISSIONS.recruiting);
  const collection = await applications();
  const application = await collection.findOne({
    organizationId: user.organizationId,
    "files._id": fileId,
  });
  const file = application?.files.find((candidate) => candidate._id === fileId);
  if (!application || !file) throw new Error("Datei nicht gefunden");
  if (file.status === "rejected") {
    throw new Error("Abgelehnte Dateien können nicht erneut importiert werden");
  }
  if (file.status === "failed") {
    await collection.updateOne(
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
