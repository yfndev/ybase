import { requireUser } from "../../auth/session";
import { departments } from "../../db/collections";
import type { Department } from "../../db/types";

export async function getActiveDepartments(): Promise<Department[]> {
  const user = await requireUser();
  return (await departments())
    .find({ organizationId: user.organizationId, isArchived: false })
    .sort({ _creationTime: 1 })
    .toArray();
}

export async function getArchivedDepartments(): Promise<Department[]> {
  const user = await requireUser();
  return (await departments())
    .find({ organizationId: user.organizationId, isArchived: true })
    .sort({ _creationTime: 1 })
    .toArray();
}
