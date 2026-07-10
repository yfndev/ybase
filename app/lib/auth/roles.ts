import type { UserRole } from "../db/types";

export function normalizeUserRole(role: unknown): UserRole {
  return role === "admin" || role === "lead" ? "admin" : "member";
}

export function normalizeOptionalUserRole(role: unknown): UserRole | undefined {
  if (role === undefined || role === null) return undefined;
  return normalizeUserRole(role);
}

export function isLegacyLeadRole(role: unknown): boolean {
  return role === "lead";
}
