import { users } from "../db/collections";
import type { UserRole } from "../db/types";
import { auth } from "./index";
import { isLegacyLeadRole, normalizeUserRole } from "./roles";

export async function requireUser() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized user");

  const user = await (await users()).findOne({ _id: userId });
  if (!user) throw new Error("User not found");
  if (!user.organizationId) throw new Error("User has no organization");

  const role = normalizeUserRole(user.role);
  if (isLegacyLeadRole(user.role)) {
    await (await users()).updateOne({ _id: user._id }, { $set: { role } });
  }

  return { ...user, organizationId: user.organizationId, role };
}

export async function requireRole(minRole: UserRole) {
  const user = await requireUser();
  if (minRole === "admin" && user.role !== "admin") {
    throw new Error(`Insufficient permissions. Required role: ${minRole}`);
  }
  return user;
}
