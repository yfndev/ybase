import { presignNamedDownload } from "../../s3/storage";
import { requireRecruitingApplicationFile } from "./access";

export async function getApplicationFileDownloadUrl(
  fileId: string,
): Promise<string> {
  const { file } = await requireRecruitingApplicationFile(fileId, ["imported"]);
  if (!file?.storageKey) throw new Error("Datei nicht verfügbar");
  return presignNamedDownload(file.storageKey, file.fileName);
}
