import type { ApplicationFile } from "../../db/application";
import { newId } from "../../db/ids";
import type { ParsedApplicationFile } from "./tallyFiles";

export function createApplicationFile(
  file: ParsedApplicationFile,
): ApplicationFile {
  return {
    _id: newId(),
    fieldKey: file.fieldKey,
    fieldLabel: file.fieldLabel,
    sourceId: file.sourceId,
    sourceUrl: file.sourceUrl,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    status: file.validationError ? "rejected" : "pending",
    attempts: 0,
    error: file.validationError,
    updatedAt: Date.now(),
  };
}
