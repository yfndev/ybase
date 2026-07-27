import { detectApplicationFileType } from "../applications/fileValidation";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export type ProfileImageContentType = "image/jpeg" | "image/png";

export function validateProfileImage(
  bytes: Uint8Array,
): ProfileImageContentType {
  if (bytes.byteLength === 0 || bytes.byteLength > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error("Das Profilbild darf maximal 5 MB groß sein");
  }
  const detectedType = detectApplicationFileType(bytes);
  if (!detectedType || !PROFILE_IMAGE_TYPES.has(detectedType)) {
    throw new Error("Bitte verwende ein JPEG- oder PNG-Bild");
  }
  return detectedType as ProfileImageContentType;
}
