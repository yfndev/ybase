import { requireUser } from "../../auth/session";
import { projects } from "../../db/collections";
import type { Project } from "../../db/types";

export async function getAllProjects(): Promise<Project[]> {
  const user = await requireUser();
  return (await projects())
    .find({ organizationId: user.organizationId, isArchived: false })
    .sort({ _creationTime: 1 })
    .toArray();
}

export async function getArchivedProjects(): Promise<Project[]> {
  const user = await requireUser();
  return (await projects())
    .find({ organizationId: user.organizationId, isArchived: true })
    .sort({ _creationTime: 1 })
    .toArray();
}

export async function getProjectById(projectId: string): Promise<Project> {
  const user = await requireUser();
  const project = await (await projects()).findOne({ _id: projectId });
  if (!project || project.organizationId !== user.organizationId) {
    throw new Error("No access");
  }
  return project;
}
