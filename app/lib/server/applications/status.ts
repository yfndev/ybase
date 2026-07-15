import { applications } from "../../db/collections";
import type { ApplicationFile, ApplicationFileStatus } from "../../db/types";

export async function setApplicationFileStatus(
  applicationId: string,
  fileId: string,
  status: ApplicationFileStatus,
  details: { error?: string; storageKey?: string; importedAt?: number } = {},
): Promise<void> {
  const set: Record<string, unknown> = {
    "files.$[file].status": status,
    "files.$[file].updatedAt": Date.now(),
    ...(details.error ? { "files.$[file].error": details.error } : {}),
    ...(details.storageKey
      ? { "files.$[file].storageKey": details.storageKey }
      : {}),
    ...(details.importedAt
      ? { "files.$[file].importedAt": details.importedAt }
      : {}),
  };
  const update: Record<string, unknown> = { $set: set };
  if (!details.error) update.$unset = { "files.$[file].error": "" };
  await (
    await applications()
  ).updateOne({ _id: applicationId }, update, {
    arrayFilters: [{ "file._id": fileId }],
  });
}

export async function claimApplicationFile(
  applicationId: string,
  fileId: string,
): Promise<ApplicationFile | null> {
  const collection = await applications();
  const application = await collection.findOne({
    _id: applicationId,
    files: {
      $elemMatch: { _id: fileId, status: { $in: ["pending", "failed"] } },
    },
  });
  const file = application?.files.find((candidate) => candidate._id === fileId);
  if (!file) return null;
  const claimed = await collection.updateOne(
    { _id: applicationId },
    {
      $set: {
        "files.$[file].status": "importing",
        "files.$[file].updatedAt": Date.now(),
      },
      $inc: { "files.$[file].attempts": 1 },
      $unset: { "files.$[file].error": "" },
    },
    { arrayFilters: [{ "file._id": fileId, "file.status": file.status }] },
  );
  return claimed.modifiedCount === 1 ? file : null;
}
