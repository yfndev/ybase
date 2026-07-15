import { organizations, projects } from "../db/collections";
import { newId } from "../db/ids";
import type { Organization, Project, User, UserRole } from "../db/types";

export type TestActor = User & {
  organizationId: string;
  role: UserRole;
};

export function createTestActor(
  overrides: Pick<TestActor, "organizationId"> & Partial<TestActor>,
): TestActor {
  return {
    _id: newId(),
    _creationTime: Date.now(),
    role: "admin",
    memberStatus: "active",
    teamOnboardingStatus: "completed",
    registeredAt: Date.now(),
    ...overrides,
  };
}

export async function insertTestOrganization(
  overrides: Partial<Organization> = {},
): Promise<Organization> {
  const id = overrides._id ?? newId();
  const organization: Organization = {
    _id: id,
    _creationTime: Date.now(),
    name: "Test Organization",
    domain: `${id}.test`,
    createdBy: newId(),
    ...overrides,
  };
  await (await organizations()).insertOne(organization);
  return organization;
}

export async function insertTestProject(
  overrides: Pick<Project, "organizationId" | "createdBy"> & Partial<Project>,
): Promise<Project> {
  const project: Project = {
    _id: newId(),
    _creationTime: Date.now(),
    name: "Test Project",
    isArchived: false,
    ...overrides,
  };
  await (await projects()).insertOne(project);
  return project;
}
