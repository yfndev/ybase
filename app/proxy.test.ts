import { expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: (handler: unknown) => handler,
}));

import { isPublicPath } from "../proxy";

test("allows reimbursement invite links before authentication", () => {
  expect(isPublicPath("/invite/reimbursement-token")).toBe(true);
});

test("allows guardian resignation links without exposing the member page", () => {
  expect(isPublicPath("/membership/resignation/secure-token")).toBe(true);
  expect(isPublicPath("/membership")).toBe(false);
});

test("does not treat similarly named routes as public", () => {
  expect(isPublicPath("/invited-users")).toBe(false);
});
