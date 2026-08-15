import { hasPermission, USER_PERMISSIONS } from "../../auth/roles";
import { requireUser } from "../../auth/session";
import { users } from "../../db/collections";
import type { User } from "../../db/types";

const WITHOUT_SENSITIVE_FIELDS = {
  iban: 0,
  bic: 0,
  accountHolder: 0,
  privateEmail: 0,
  phone: 0,
} as const;

export async function getUserOrganizationId(): Promise<string> {
  const user = await requireUser();
  return user.organizationId;
}

export async function getCurrentUserProfile(): Promise<User> {
  const user = await requireUser();
  return user;
}

export async function listMembers(): Promise<User[]> {
  const user = await requireUser();
  const canManageMembers = hasPermission(user.role, USER_PERMISSIONS.members);
  const canManageRecruiting = hasPermission(
    user.role,
    USER_PERMISSIONS.recruiting,
  );
  if (!canManageMembers && !canManageRecruiting) {
    throw new Error(
      "Insufficient permissions. Required permission: manage_members or manage_recruiting",
    );
  }
  return (await users())
    .find({ organizationId: user.organizationId })
    .project<User>(canManageMembers ? {} : WITHOUT_SENSITIVE_FIELDS)
    .sort({ _creationTime: 1 })
    .toArray();
}
