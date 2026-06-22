import { users } from "../db/collections";
import type { UserRole } from "../db/types";
import { auth } from "./index";

const roleHierarchy: Record<UserRole, number> = { member: 0, lead: 1, admin: 2 };

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized user");

  const user = await (await users()).findOne({ _id: userId });
  if (!user) throw new Error("User not found");
  if (!user.organizationId) throw new Error("User has no organization");

  return { ...user, organizationId: user.organizationId, role: user.role };
}

export async function requireRole(minRole: UserRole) {
  const user = await requireUser();
  const role = user.role ?? "member";
  if (roleHierarchy[role] < roleHierarchy[minRole]) {
    throw new Error(`Insufficient permissions. Required role: ${minRole}`);
  }
  return user;
}
