import { applications } from "../../db/collections";
import { putObject } from "../../s3/storage";
import { downloadApplicationFile, RejectedFileError } from "./fileDownload";
import { safeStorageFileName } from "./fileValidation";
import { claimApplicationFile, setApplicationFileStatus } from "./status";

export async function importApplicationFile(
  applicationId: string,
  fileId: string,
  dependencies: { fetcher?: typeof fetch; uploader?: typeof putObject } = {},
): Promise<void> {
  const file = await claimApplicationFile(applicationId, fileId);
  if (!file) return;
  try {
    const { bytes, contentType } = await downloadApplicationFile(
      file,
      dependencies.fetcher ?? fetch,
    );
    const storageKey = `applications/${applicationId}/${fileId}/${safeStorageFileName(file.fileName)}`;
    await (dependencies.uploader ?? putObject)(storageKey, bytes, contentType);
    await setApplicationFileStatus(applicationId, fileId, "imported", {
      storageKey,
      importedAt: Date.now(),
    });
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
  }
}

export async function importApplicationFiles(
  applicationId: string,
): Promise<void> {
  const application = await (
    await applications()
  ).findOne({
    _id: applicationId,
  });
  if (!application) return;
  await Promise.all(
    application.files.map((file) =>
      importApplicationFile(applicationId, file._id),
    ),
  );
}
