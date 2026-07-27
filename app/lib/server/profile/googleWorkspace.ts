import { workspaceRequest } from "../../googleWorkspace/client";

export async function updateGoogleWorkspacePhoto(
  email: string,
  bytes: Uint8Array,
): Promise<void> {
  try {
    await workspaceRequest(
      `users/${encodeURIComponent(email)}/photos/thumbnail`,
      {
        method: "PUT",
        data: { photoData: Buffer.from(bytes).toString("base64url") },
      },
    );
  } catch {
    throw new Error(
      "Das Profilbild konnte nicht mit Google Workspace synchronisiert werden",
    );
  }
}
