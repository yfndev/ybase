import type { UserRole } from "../db/types";

const roleHierarchy: Record<UserRole, number> = {
  member: 0,
  finance: 1,
  admin: 2,
};

export function normalizeUserRole(role: unknown): UserRole {
  if (role === "admin") return "admin";
  if (role === "finance") return "finance";
  return "member";
}

export function normalizeOptionalUserRole(role: unknown): UserRole | undefined {
  if (role === undefined || role === null) return undefined;
  return normalizeUserRole(role);
}

export function hasMinimumRole(role: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[role] >= roleHierarchy[minimumRole];
}
