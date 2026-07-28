"use server";

import { z } from "zod";
import { requireUser } from "../../auth/session";
import { signatureTokens } from "../../db/collections";
import { newId } from "../../db/ids";
import {
  REIMBURSEMENT_STORAGE_TYPES,
  type ReimbursementStorageType,
} from "../../s3/keys";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

export async function createToken(
  input: ReimbursementStorageType,
): Promise<string> {
  const user = await requireUser();
  const reimbursementType = z.enum(REIMBURSEMENT_STORAGE_TYPES).parse(input);
  const token = crypto.randomUUID();

  await (
    await signatureTokens()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    token,
    organizationId: user.organizationId,
    createdBy: user._id,
    reimbursementType,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });

  return token;
}
