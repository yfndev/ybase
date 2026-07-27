"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { departments } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";

const nameSchema = z.object({ name: z.string().trim().min(1) });

export async function createDepartment(input: {
  name: string;
}): Promise<string> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { name } = nameSchema.parse(input);

  const _id = newId();
  await (
    await departments()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    name,
    organizationId: user.organizationId,
    isArchived: false,
    createdBy: user._id,
  });
  await addLog(user.organizationId, user._id, "department.create", _id, name);
  return _id;
}

export async function updateDepartment(input: {
  departmentId: string;
  name: string;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { departmentId, name } = z
    .object({ departmentId: z.string(), ...nameSchema.shape })
    .parse(input);

  await requireOwnedDepartment(departmentId, user.organizationId);
  await (
    await departments()
  ).updateOne({ _id: departmentId }, { $set: { name } });
  await addLog(
    user.organizationId,
    user._id,
    "department.update",
    departmentId,
    name,
  );
}

export async function archiveDepartment(input: {
  departmentId: string;
}): Promise<void> {
  await setArchived(input.departmentId, true, "department.archive");
}

export async function unarchiveDepartment(input: {
  departmentId: string;
}): Promise<void> {
  await setArchived(input.departmentId, false, "department.unarchive");
}

async function setArchived(
  departmentId: string,
  isArchived: boolean,
  action: string,
): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const id = z.string().parse(departmentId);
  const department = await requireOwnedDepartment(id, user.organizationId);
  await (await departments()).updateOne({ _id: id }, { $set: { isArchived } });
  await addLog(user.organizationId, user._id, action, id, department.name);
}

async function requireOwnedDepartment(
  departmentId: string,
  organizationId: string,
) {
  const department = await (await departments()).findOne({ _id: departmentId });
  if (!department || department.organizationId !== organizationId) {
    throw new Error("Access denied");
  }
  return department;
}
