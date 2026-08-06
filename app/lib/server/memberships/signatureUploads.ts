"use server";

import { z } from "zod";
import { membershipSignatureUploadDirectory } from "../../s3/keys";
import { presignDownload, presignUpload } from "../../s3/storage";
import { registerPendingUpload, userOwnsUpload } from "../uploads/ownership";
import { requireOnboardingUser } from "./onboardingActor";

export async function createMembershipSignatureUpload(
  contentType: string,
): Promise<{ key: string; url: string }> {
  const actor = await requireOnboardingUser();
  const parsedContentType = z.literal("image/png").parse(contentType);
  const upload = await presignUpload(
    parsedContentType,
    membershipSignatureUploadDirectory(actor.organizationId, actor._id),
  );
  await registerPendingUpload(upload.key, {
    organizationId: actor.organizationId,
    userId: actor._id,
    contextType: "user",
    contextId: actor._id,
  });
  return upload;
}

export async function getMembershipSignatureUrl(
  input: string,
): Promise<string> {
  const actor = await requireOnboardingUser(true);
  const storageKey = z.string().min(1).parse(input);
  if (!(await userOwnsUpload(storageKey, actor.organizationId, actor._id))) {
    throw new Error("Die Unterschrift wurde nicht gefunden.");
  }
  return presignDownload(storageKey);
}
