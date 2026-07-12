import { expect, test } from "vitest";
import { hasMinimumRole, normalizeUserRole } from "./roles";

test("unknown roles default to member access", () => {
  expect(normalizeUserRole("unknown")).toBe("member");
});

test("finance can manage reimbursements without admin access", () => {
  expect(hasMinimumRole("finance", "finance")).toBe(true);
  expect(hasMinimumRole("finance", "admin")).toBe(false);
});

test("admin inherits finance access", () => {
  expect(hasMinimumRole("admin", "finance")).toBe(true);
});
