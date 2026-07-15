import { applications } from "../../db/collections";
import { deleteObject, putObject } from "../../s3/storage";
import { downloadApplicationFile, RejectedFileError } from "./fileDownload";
import { applicationFileStorageKey } from "./fileStorage";
import { claimApplicationFile, setApplicationFileStatus } from "./status";

export async function importApplicationFile(
  applicationId: string,
  fileId: string,
  dependencies: {
    fetcher?: typeof fetch;
    uploader?: typeof putObject;
    deleter?: typeof deleteObject;
  } = {},
): Promise<void> {
  const file = await claimApplicationFile(applicationId, fileId);
  if (!file) return;
  let storageKey: string;
  try {
    const { bytes, contentType } = await downloadApplicationFile(
      file,
      dependencies.fetcher ?? fetch,
    );
    storageKey = applicationFileStorageKey(applicationId, file);
    await (dependencies.uploader ?? putObject)(storageKey, bytes, contentType);
  } catch (error) {
    const rejected = error instanceof RejectedFileError;
    const message =
      error instanceof RejectedFileError
        ? error.message
        : "Übertragung fehlgeschlagen.";
    await setApplicationFileStatus(
      applicationId,
      fileId,
      rejected ? "rejected" : "failed",
      {
        error: message,
      },
    );
    return;
  }

  const retained = await setApplicationFileStatus(
    applicationId,
    fileId,
    "imported",
    { storageKey, importedAt: Date.now() },
  );
  if (!retained) {
    await (dependencies.deleter ?? deleteObject)(storageKey);
  }
}

export async function importApplicationFiles(
  applicationId: string,
): Promise<void> {
  const application = await (
    await applications()
  ).findOne({
    _id: applicationId,
    status: { $ne: "withdrawn" },
  });
  if (!application) return;
  await Promise.all(
    application.files.map((file) =>
      importApplicationFile(applicationId, file._id),
    ),
  );
}
