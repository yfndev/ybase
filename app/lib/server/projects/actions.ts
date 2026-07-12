"use server";

import { z } from "zod";
import { requireRole } from "../../auth/session";
import {
  projects,
  reimbursements,
  volunteerAllowance,
} from "../../db/collections";
import { newId } from "../../db/ids";
import { addLog } from "../logs";

const projectFieldsSchema = z.object({
  name: z.string().trim().min(1),
  travelDestination: z.string().trim().optional(),
  travelPurpose: z.string().trim().optional(),
});

export async function createProject(input: {
  name: string;
  travelDestination?: string;
  travelPurpose?: string;
}): Promise<string> {
  const user = await requireRole("admin");
  const { name, travelDestination, travelPurpose } =
    projectFieldsSchema.parse(input);

  const _id = newId();
  await (
    await projects()
  ).insertOne({
    _id,
    _creationTime: Date.now(),
    name,
    ...(travelDestination ? { travelDestination } : {}),
    ...(travelPurpose ? { travelPurpose } : {}),
    organizationId: user.organizationId,
    isArchived: false,
    createdBy: user._id,
  });
  await addLog(user.organizationId, user._id, "project.create", _id, name);
  return _id;
}

export async function updateProject(input: {
  projectId: string;
  name: string;
  travelDestination?: string;
  travelPurpose?: string;
}): Promise<void> {
  const user = await requireRole("admin");
  const { projectId, name, travelDestination, travelPurpose } = z
    .object({ projectId: z.string(), ...projectFieldsSchema.shape })
    .parse(input);

  await requireOwnedProject(projectId, user.organizationId);
  await (
    await projects()
  ).updateOne(
    { _id: projectId },
    {
      $set: {
        name,
        travelDestination: travelDestination ?? "",
        travelPurpose: travelPurpose ?? "",
      },
    },
  );
  await addLog(
    user.organizationId,
    user._id,
    "project.update",
    projectId,
    name,
  );
}

export async function archiveProject(input: {
  projectId: string;
}): Promise<void> {
  await setArchived(input.projectId, true, "project.archive");
}

export async function unarchiveProject(input: {
  projectId: string;
}): Promise<void> {
  await setArchived(input.projectId, false, "project.unarchive");
}

export async function checkProjectLinkedData(input: {
  projectId: string;
}): Promise<{ hasLinkedData: boolean }> {
  const user = await requireRole("admin");
  const { projectId } = z.object({ projectId: z.string() }).parse(input);
  await requireOwnedProject(projectId, user.organizationId);

  const scope = { organizationId: user.organizationId, projectId };
  const [reimbursement, allowance] = await Promise.all([
    (await reimbursements()).findOne(scope),
    (await volunteerAllowance()).findOne(scope),
  ]);
  return { hasLinkedData: Boolean(reimbursement || allowance) };
}

export async function deleteProject(input: {
  projectId: string;
  mergeIntoProjectId?: string;
}): Promise<void> {
  const user = await requireRole("admin");
  const { projectId, mergeIntoProjectId } = z
    .object({
      projectId: z.string(),
      mergeIntoProjectId: z.string().optional(),
    })
    .parse(input);

  const project = await requireOwnedProject(projectId, user.organizationId);

  if (mergeIntoProjectId) {
    if (mergeIntoProjectId === projectId) {
      throw new Error("Zielprojekt darf nicht das gleiche Projekt sein");
    }
    const target = await (
      await projects()
    ).findOne({ _id: mergeIntoProjectId });
    if (!target || target.organizationId !== user.organizationId) {
      throw new Error("Zielprojekt nicht gefunden");
    }
    const from = { organizationId: user.organizationId, projectId };
    const to = { $set: { projectId: mergeIntoProjectId } };
    await (await reimbursements()).updateMany(from, to);
    await (await volunteerAllowance()).updateMany(from, to);
  }

  await (await projects()).deleteOne({ _id: projectId });
  await addLog(
    user.organizationId,
    user._id,
    "project.delete",
    projectId,
    project.name,
  );
}

async function setArchived(
  projectId: string,
  isArchived: boolean,
  action: string,
): Promise<void> {
  const user = await requireRole("admin");
  const id = z.string().parse(projectId);
  const project = await requireOwnedProject(id, user.organizationId);
  await (await projects()).updateOne({ _id: id }, { $set: { isArchived } });
  await addLog(user.organizationId, user._id, action, id, project.name);
}

async function requireOwnedProject(projectId: string, organizationId: string) {
  const project = await (await projects()).findOne({ _id: projectId });
  if (!project || project.organizationId !== organizationId) {
    throw new Error("Access denied");
  }
  return project;
}
