import { createHash, randomBytes } from "node:crypto";

export function hashGuardianConsentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createGuardianConsentToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashGuardianConsentToken(token) };
}
