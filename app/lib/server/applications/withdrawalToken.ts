import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export function hashApplicationWithdrawalToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createApplicationWithdrawalToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashApplicationWithdrawalToken(token) };
}
