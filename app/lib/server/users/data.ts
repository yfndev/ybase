import {
  requirePermission,
  requireRole,
  requireUser,
} from "../../auth/session";
import { users } from "../../db/collections";
import type { User } from "../../db/types";

export async function getUserOrganizationId(): Promise<string> {
  const user = await requireUser();
  return user.organizationId;
}

export async function getCurrentUserProfile(): Promise<User> {
  const user = await requireUser();
  return user;
}

export async function listOrganizationUsers(): Promise<User[]> {
  const user = await requireRole("admin");
  return (await users())
    .find({ organizationId: user.organizationId })
    .sort({ _creationTime: 1 })
    .toArray();
}

export async function listMembers(): Promise<User[]> {
  const user = await requirePermission("manage_members");
  return (await users())
    .find({ organizationId: user.organizationId })
    .sort({ _creationTime: 1 })
    .toArray();
}
