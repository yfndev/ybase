import { requirePermission } from "../../auth/session";
import { departments, teams, users } from "../../db/collections";

export async function loadManagedMember(userId: string) {
  const currentUser = await requirePermission("manage_members");
  const target = await (await users()).findOne({ _id: userId });
  if (!target || target.organizationId !== currentUser.organizationId) {
    throw new Error("User not found");
  }
  return { currentUser, target };
}

export async function requireActiveOrganizationTeam(
  teamId: string,
  organizationId: string,
) {
  const team = await (
    await teams()
  ).findOne({
    _id: teamId,
    organizationId,
    isArchived: false,
  });
  if (!team) throw new Error("Team nicht verfügbar");
  return team;
}

export async function requireActiveOrganizationDepartment(
  departmentId: string,
  organizationId: string,
) {
  const department = await (
    await departments()
  ).findOne({
    _id: departmentId,
    organizationId,
    isArchived: false,
  });
  if (!department) throw new Error("Department nicht verfügbar");
  return department;
}
