import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createResignationConsentToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashResignationConsentToken(token) };
}

export function hashResignationConsentToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isResignationConsentToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}
