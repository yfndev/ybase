import { createHmac } from "node:crypto";
import { expect, test } from "vitest";
import { verifyTallySignature } from "./signature";

const SECRET = "whsec_test_secret";
const BODY = '{"eventId":"e1","data":{"submissionId":"s1"}}';

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("base64");
}

test("accepts a signature over the exact raw body", () => {
  expect(verifyTallySignature(BODY, sign(BODY), SECRET)).toBe(true);
});

test("rejects a signature made with a different secret", () => {
  expect(verifyTallySignature(BODY, sign(BODY, "other"), SECRET)).toBe(false);
});

test("rejects when the body was modified after signing", () => {
  const signature = sign(BODY);
  expect(verifyTallySignature(`${BODY} `, signature, SECRET)).toBe(false);
});

test("rejects a missing signature", () => {
  expect(verifyTallySignature(BODY, null, SECRET)).toBe(false);
  expect(verifyTallySignature(BODY, undefined, SECRET)).toBe(false);
});

test("rejects a signature of a different length without throwing", () => {
  expect(verifyTallySignature(BODY, "short", SECRET)).toBe(false);
});
