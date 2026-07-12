"use server";

import { requireUser } from "../../auth/session";
import { signatureTokens } from "../../db/collections";
import { newId } from "../../db/ids";

const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

export async function createToken(): Promise<string> {
  const user = await requireUser();
  const token = crypto.randomUUID();

  await (
    await signatureTokens()
  ).insertOne({
    _id: newId(),
    _creationTime: Date.now(),
    token,
    organizationId: user.organizationId,
    createdBy: user._id,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });

  return token;
}
