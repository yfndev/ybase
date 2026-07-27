"use server";

import { z } from "zod";
import { USER_PERMISSIONS } from "../../auth/roles";
import { requirePermission } from "../../auth/session";
import { departments } from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";
import { scheduleTeamDirectoryRevalidation } from "../teamDirectory/revalidate";

const nameSchema = z.object({ name: z.string().trim().min(1) });
const sortOrderSchema = z.number().int().min(0).max(9999);

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
    websiteSortOrder: 100,
  });
  await addLog(user.organizationId, user._id, "department.create", _id, name);
  return _id;
}

export async function updateDepartment(input: {
  departmentId: string;
  name: string;
  websiteSortOrder?: number;
}): Promise<void> {
  const user = await requirePermission(USER_PERMISSIONS.organizationStructure);
  const { departmentId, name, websiteSortOrder } = z
    .object({
      departmentId: z.string(),
      websiteSortOrder: sortOrderSchema.optional(),
      ...nameSchema.shape,
    })
    .parse(input);

  await requireOwnedDepartment(departmentId, user.organizationId);
  const changes = {
    name,
    ...(websiteSortOrder === undefined ? {} : { websiteSortOrder }),
  };
  await (
    await departments()
  ).updateOne({ _id: departmentId }, { $set: changes });
  scheduleTeamDirectoryRevalidation();
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
  scheduleTeamDirectoryRevalidation();
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
