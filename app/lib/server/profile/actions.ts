"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuthenticatedUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { StoredMemberStatus } from "../../db/types";
import { isUnavailableMemberStatus } from "../../members/status";
import { profileImageUploadDirectory } from "../../s3/keys";
import {
  getObjectBuffer,
  getObjectSize,
  presignUpload,
  putObject,
} from "../../s3/storage";
import {
  claimPendingUploads,
  contextOwnsUpload,
  registerPendingUpload,
} from "../uploads/ownership";
import { downloadGoogleProfilePhoto } from "./googlePhoto";
import { updateGoogleWorkspacePhoto } from "./googleWorkspace";
import {
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
  validateProfileImage,
} from "./validation";

const completeSchema = z.object({
  source: z.enum(["google", "upload"]),
  storageKey: z.string().trim().min(1).optional(),
});

function requireEligibleUser<
  T extends {
    organizationId?: string;
    memberStatus: StoredMemberStatus;
  },
>(user: T): asserts user is T & { organizationId: string } {
  if (!user.organizationId) throw new Error("User has no organization");
  if (isUnavailableMemberStatus(user.memberStatus)) {
    throw new Error("User is unavailable");
  }
}

export async function generateProfileImageUpload(
  contentType: string,
): Promise<{ key: string; url: string }> {
  const user = await requireAuthenticatedUser();
  requireEligibleUser(user);
  if (!PROFILE_IMAGE_TYPES.has(contentType)) {
    throw new Error("Bitte verwende ein JPEG- oder PNG-Bild");
  }

  const upload = await presignUpload(
    contentType,
    profileImageUploadDirectory(user._id),
  );
  await registerPendingUpload(upload.key, {
    organizationId: user.organizationId,
    userId: user._id,
    contextType: "profileImage",
    contextId: user._id,
  });
  return upload;
}

export async function completePublicProfile(input: {
  source: "google" | "upload";
  storageKey?: string;
}): Promise<void> {
  const parsed = completeSchema.parse(input);
  const user = await requireAuthenticatedUser();
  requireEligibleUser(user);
  if (user.publicProfileSetupRequired !== true) return;

  let storageKey: string;
  let contentType: "image/jpeg" | "image/png";
  let googleProfileImageSyncedAt: number | undefined;

  if (parsed.source === "google") {
    if (user.googlePhotoIsDefault !== false || !user.image) {
      throw new Error("Bitte lade ein eigenes Profilbild hoch");
    }
    const image = await downloadGoogleProfilePhoto(user.image);
    storageKey = `profile-images/${user._id}/${randomUUID()}`;
    contentType = image.contentType;
    await putObject(storageKey, image.bytes, contentType);
  } else {
    if (!parsed.storageKey) throw new Error("Bitte wähle ein Profilbild aus");
    const ownsUpload = await contextOwnsUpload(
      parsed.storageKey,
      user.organizationId,
      "profileImage",
      user._id,
    );
    if (!ownsUpload) throw new Error("Das Profilbild gehört nicht zu dir");

    const objectSize = await getObjectSize(parsed.storageKey);
    if (objectSize === 0 || objectSize > PROFILE_IMAGE_MAX_BYTES) {
      throw new Error("Das Profilbild darf maximal 5 MB groß sein");
    }
    const bytes = await getObjectBuffer(parsed.storageKey);
    contentType = validateProfileImage(bytes);
    if (!user.email) throw new Error("Dein Google-Konto wurde nicht gefunden");
    await updateGoogleWorkspacePhoto(user.email, bytes);
    googleProfileImageSyncedAt = Date.now();
    storageKey = parsed.storageKey;
    await claimPendingUploads(
      [storageKey],
      { organizationId: user.organizationId, userId: user._id },
      ["profileImage"],
      { type: "profileImage", id: user._id },
      user._id,
    );
  }

  const now = Date.now();
  const result = await (
    await users()
  ).updateOne(
    { _id: user._id, publicProfileSetupRequired: true },
    {
      $set: {
        publicProfileSetupRequired: false,
        googlePhotoIsDefault: false,
        profileImageStorageKey: storageKey,
        profileImageContentType: contentType,
        profileImageSource: parsed.source,
        publicProfileCompletedAt: now,
        ...(googleProfileImageSyncedAt ? { googleProfileImageSyncedAt } : {}),
      },
    },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Das öffentliche Profil konnte nicht gespeichert werden");
  }
}
