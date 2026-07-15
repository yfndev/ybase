import type { ApplicationFile } from "../../db/types";
import { safeStorageFileName } from "./fileValidation";

export function applicationFileStorageKey(
  applicationId: string,
  file: Pick<ApplicationFile, "_id" | "fileName">,
): string {
  return `applications/${applicationId}/${file._id}/${safeStorageFileName(file.fileName)}`;
}
