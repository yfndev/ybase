import {
  PROFILE_IMAGE_MAX_BYTES,
  validateProfileImage,
  type ProfileImageContentType,
} from "./validation";

function isGoogleImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com"))
    );
  } catch {
    return false;
  }
}

export async function downloadGoogleProfilePhoto(
  imageUrl: string,
): Promise<{ bytes: Buffer; contentType: ProfileImageContentType }> {
  if (!isGoogleImageUrl(imageUrl)) {
    throw new Error("Das Google-Profilbild konnte nicht sicher geladen werden");
  }
  const highResolutionUrl = imageUrl.replace(/=s\d+-c(?:-k)?$/, "=s512-c");
  const response = await fetch(highResolutionUrl, {
    headers: { Accept: "image/jpeg, image/png" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok || !isGoogleImageUrl(response.url)) {
    throw new Error("Das Google-Profilbild konnte nicht geladen werden");
  }
  const contentLength = Number(response.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > PROFILE_IMAGE_MAX_BYTES
  ) {
    throw new Error("Das Google-Profilbild ist größer als 5 MB");
  }

  if (!response.body) {
    throw new Error("Das Google-Profilbild konnte nicht geladen werden");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    byteLength += value.byteLength;
    if (byteLength > PROFILE_IMAGE_MAX_BYTES) {
      await reader.cancel();
      throw new Error("Das Google-Profilbild ist größer als 5 MB");
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks, byteLength);
  return { bytes, contentType: validateProfileImage(bytes) };
}
