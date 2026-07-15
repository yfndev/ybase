import type { UserRole } from "../db/types";

export type UserPermission =
  | "manage_finance"
  | "manage_recruiting"
  | "manage_members"
  | "manage_organization_structure"
  | "manage_roles"
  | "manage_organization_settings"
  | "manage_projects"
  | "view_audit_logs";

const rolePermissions: Record<
  Exclude<UserRole, "admin">,
  readonly UserPermission[]
> = {
  member: [],
  finance: ["manage_finance"],
  people_culture: [
    "manage_recruiting",
    "manage_members",
    "manage_organization_structure",
  ],
};

const validRoles = new Set<UserRole>([
  "admin",
  "finance",
  "people_culture",
  "member",
]);

export const USER_PERMISSIONS = {
  finance: "manage_finance",
  recruiting: "manage_recruiting",
  members: "manage_members",
  organizationStructure: "manage_organization_structure",
  roles: "manage_roles",
  organizationSettings: "manage_organization_settings",
  projects: "manage_projects",
  auditLogs: "view_audit_logs",
} as const satisfies Record<string, UserPermission>;

export function normalizeUserRole(role: unknown): UserRole {
  return validRoles.has(role as UserRole) ? (role as UserRole) : "member";
}

export function normalizeOptionalUserRole(role: unknown): UserRole | undefined {
  if (role === undefined || role === null) return undefined;
  return normalizeUserRole(role);
}

export function hasRoleAccess(role: unknown, requiredRole: UserRole): boolean {
  if (requiredRole === "member") return true;
  if (requiredRole === "admin") return normalizeUserRole(role) === "admin";
  if (requiredRole === "finance") {
    return hasPermission(role, USER_PERMISSIONS.finance);
  }
  return hasPermission(role, USER_PERMISSIONS.recruiting);
}

export function hasPermission(
  role: unknown,
  permission: UserPermission,
): boolean {
  const normalizedRole = normalizeUserRole(role);
  if (normalizedRole === "admin") return true;
  return rolePermissions[normalizedRole].includes(permission);
}
