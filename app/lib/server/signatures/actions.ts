"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { signatureTokens } from "../../db/collections";
import { newId } from "../../db/ids";
import {
  MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT,
  SIGNATURE_UPLOAD_CONTEXTS,
  type SignatureUploadContext,
  isReimbursementSignatureContext,
} from "../../signatures/context";
import { requireOnboardingUser } from "../memberships/onboardingActor";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

export async function createToken(
  input: SignatureUploadContext,
): Promise<string> {
  const uploadContext = z.enum(SIGNATURE_UPLOAD_CONTEXTS).parse(input);
  const user =
    uploadContext === MEMBERSHIP_ONBOARDING_SIGNATURE_CONTEXT
      ? await requireOnboardingUser()
      : await requireUser();
  const token = crypto.randomUUID();

  await (
    await signatureTokens()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    token,
    organizationId: user.organizationId,
    createdBy: user._id,
    uploadContext,
    ...(isReimbursementSignatureContext(uploadContext)
      ? { reimbursementType: uploadContext }
      : {}),
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });

  return token;
}
