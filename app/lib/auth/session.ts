import { users } from "../db/collections";
import type { UserRole } from "../db/types";
import { auth } from "./index";
import {
  hasRoleAccess,
  hasPermission,
  normalizeUserRole,
  type UserPermission,
} from "./roles";

export async function requireAuthenticatedUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized user");

  const user = await (await users()).findOne({ _id: userId });
  if (!user) throw new Error("User not found");

  return user;
}

export async function requireUser() {
  const user = await requireAuthenticatedUser();
  if (!user.organizationId) throw new Error("User has no organization");

  const role = normalizeUserRole(user.role);
  return { ...user, organizationId: user.organizationId, role };
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireUser();
  if (!hasRoleAccess(user.role, requiredRole)) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`);
  }
  return user;
}

export async function requirePermission(permission: UserPermission) {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(
      `Insufficient permissions. Required permission: ${permission}`,
    );
  }
  return user;
}
