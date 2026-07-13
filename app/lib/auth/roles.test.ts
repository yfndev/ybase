import { describe, expect, test } from "vitest";
import type { UserRole } from "../db/types";
import {
  hasPermission,
  hasRoleAccess,
  normalizeOptionalUserRole,
  normalizeUserRole,
  USER_PERMISSIONS,
  type UserPermission,
} from "./roles";

const roles: UserRole[] = ["member", "finance", "people_culture", "admin"];

const expectedRoleAccess: Record<UserRole, UserRole[]> = {
  member: ["member"],
  finance: ["member", "finance"],
  people_culture: ["member", "people_culture"],
  admin: roles,
};

const permissions = Object.values(USER_PERMISSIONS);
const expectedPermissions: Record<UserRole, UserPermission[]> = {
  member: [],
  finance: [USER_PERMISSIONS.finance],
  people_culture: [
    USER_PERMISSIONS.recruiting,
    USER_PERMISSIONS.members,
    USER_PERMISSIONS.organizationStructure,
  ],
  admin: permissions,
};

test.each(roles)("normalizes the supported %s role", (role) => {
  expect(normalizeUserRole(role)).toBe(role);
});

test.each(["unknown", "ADMIN", "", 1, null, undefined])(
  "normalizes invalid role %j to member",
  (role) => {
    expect(normalizeUserRole(role)).toBe("member");
  },
);

test("keeps an absent optional role absent", () => {
  expect(normalizeOptionalUserRole(undefined)).toBeUndefined();
  expect(normalizeOptionalUserRole(null)).toBeUndefined();
  expect(normalizeOptionalUserRole("invalid")).toBe("member");
});

describe.each(roles)("%s role access", (role) => {
  test.each(roles)("required role %s", (requiredRole) => {
    expect(hasRoleAccess(role, requiredRole)).toBe(
      expectedRoleAccess[role].includes(requiredRole),
    );
  });
});

describe.each(roles)("%s permissions", (role) => {
  test.each(permissions)("permission %s", (permission) => {
    expect(hasPermission(role, permission)).toBe(
      expectedPermissions[role].includes(permission),
    );
  });
});

test("unknown roles only receive member permissions", () => {
  expect(hasPermission("unknown", USER_PERMISSIONS.finance)).toBe(false);
  expect(hasRoleAccess("unknown", "member")).toBe(true);
  expect(hasRoleAccess("unknown", "finance")).toBe(false);
});
