import { users } from "../db/collections";
import type { UserRole } from "../db/types";
import { auth } from "./index";
import { hasMinimumRole, normalizeUserRole } from "./roles";

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

export async function requireRole(minRole: UserRole) {
  const user = await requireUser();
  if (!hasMinimumRole(user.role, minRole)) {
    throw new Error(`Insufficient permissions. Required role: ${minRole}`);
  }
  return user;
}
