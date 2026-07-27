"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { departments, teams } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";

const teamFieldsSchema = z.object({
  name: z.string().trim().min(1),
  departmentId: z.string().trim().min(1),
});

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
  });
  await addLog(user.organizationId, user._id, "team.create", _id, name);
  return _id;
}

export async function updateTeam(input: {
  teamId: string;
  name: string;
  departmentId: string;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { teamId, name, departmentId } = z
    .object({ teamId: z.string(), ...teamFieldsSchema.shape })
    .parse(input);

  await requireOwnedTeam(teamId, user.organizationId);
  await requireActiveDepartment(departmentId, user.organizationId);
  await (
    await teams()
  ).updateOne({ _id: teamId }, { $set: { name, departmentId } });
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
