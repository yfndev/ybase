import { projects } from "../../db/collections";
import type { Project } from "../../db/types";

export async function requireActiveOrganizationProject(
  projectId: string,
  organizationId: string,
): Promise<Project> {
  const project = await (
    await projects()
  ).findOne({
    _id: projectId,
    organizationId,
    isArchived: false,
  });

  if (!project) throw new Error("Active project not found");
  return project;
}
