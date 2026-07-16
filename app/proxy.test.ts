import { expect, test, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: (handler: unknown) => handler,
}));

import { isPublicPath } from "../proxy";

test("allows reimbursement invite links before authentication", () => {
  expect(isPublicPath("/invite/reimbursement-token")).toBe(true);
});

test("does not treat similarly named routes as public", () => {
  expect(isPublicPath("/invited-users")).toBe(false);
});
