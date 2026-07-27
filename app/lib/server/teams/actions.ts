"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { departments, teams } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";
import { scheduleTeamDirectoryRevalidation } from "../teamDirectory/revalidate";

const teamFieldsSchema = z.object({
  name: z.string().trim().min(1),
  departmentId: z.string().trim().min(1),
});
const sortOrderSchema = z.number().int().min(0).max(9999);

export async function createTeam(input: {
  name: string;
  departmentId: string;
}): Promise<string> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { name, departmentId } = teamFieldsSchema.parse(input);
  await requireActiveDepartment(departmentId, user.organizationId);

  const _id = newId();
  await (
    await teams()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    name,
    departmentId,
    organizationId: user.organizationId,
    isArchived: false,
    createdBy: user._id,
    websiteSortOrder: 100,
  });
  await addLog(user.organizationId, user._id, "team.create", _id, name);
  return _id;
}

export async function updateTeam(input: {
  teamId: string;
  name: string;
  departmentId: string;
  websiteSortOrder?: number;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { teamId, name, departmentId, websiteSortOrder } = z
    .object({
      teamId: z.string(),
      websiteSortOrder: sortOrderSchema.optional(),
      ...teamFieldsSchema.shape,
    })
    .parse(input);

  await requireOwnedTeam(teamId, user.organizationId);
  await requireActiveDepartment(departmentId, user.organizationId);
  const changes = {
    name,
    departmentId,
    ...(websiteSortOrder === undefined ? {} : { websiteSortOrder }),
  };
  await (await teams()).updateOne({ _id: teamId }, { $set: changes });
  scheduleTeamDirectoryRevalidation();
  await addLog(user.organizationId, user._id, "team.update", teamId, name);
}

export async function archiveTeam(input: { teamId: string }): Promise<void> {
  await setArchived(input.teamId, true, "team.archive");
}

export async function unarchiveTeam(input: { teamId: string }): Promise<void> {
  await setArchived(input.teamId, false, "team.unarchive");
}

async function setArchived(
  teamId: string,
  isArchived: boolean,
  action: string,
): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const id = z.string().parse(teamId);
  const team = await requireOwnedTeam(id, user.organizationId);
  await (await teams()).updateOne({ _id: id }, { $set: { isArchived } });
  scheduleTeamDirectoryRevalidation();
  await addLog(user.organizationId, user._id, action, id, team.name);
}

async function requireOwnedTeam(teamId: string, organizationId: string) {
  const team = await (await teams()).findOne({ _id: teamId });
  if (!team || team.organizationId !== organizationId) {
    throw new Error("Access denied");
  }
  return team;
}

async function requireActiveDepartment(
  departmentId: string,
  organizationId: string,
) {
  const department = await (await departments()).findOne({ _id: departmentId });
  const isUsable =
    department &&
    department.organizationId === organizationId &&
    !department.isArchived;
  if (!isUsable) {
    throw new Error("Department nicht verfügbar");
  }
  return department;
}
