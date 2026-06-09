import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("get all projects", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const projects = await t
    .withIdentity({ subject: userId })
    .query(api.projects.queries.getAllProjects, {});

  expect(projects.find((project) => project._id === projectId)).toBeDefined();
});

test("get all projects returns empty for unauthenticated user", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  const projects = await t.query(api.projects.queries.getAllProjects, {});
  expect(projects).toHaveLength(0);
});

test("get all projects returns empty for user without organization", async () => {
  const t = convexTest(schema, modules);
  const userWithoutOrg = await t.run((ctx) =>
    ctx.db.insert("users", { email: "noorg@test.com" }),
  );

  const projects = await t
    .withIdentity({ subject: userWithoutOrg })
    .query(api.projects.queries.getAllProjects, {});

  expect(projects).toHaveLength(0);
});

test("get all projects excludes archived", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Archived Project",
      organizationId,
      isArchived: true,
      createdBy: userId,
    }),
  );

  const projects = await t
    .withIdentity({ subject: userId })
    .query(api.projects.queries.getAllProjects, {});

  expect(projects.some((project) => project.name === "Archived Project")).toBe(
    false,
  );
});

test("get project by id", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const project = await t
    .withIdentity({ subject: userId })
    .query(api.projects.queries.getProjectById, { projectId });

  expect(project?._id).toBe(projectId);
});

test("get project by id returns null for unauthenticated user", async () => {
  const t = convexTest(schema, modules);
  const { projectId } = await setupTestData(t);

  const project = await t.query(api.projects.queries.getProjectById, {
    projectId,
  });
  expect(project).toBeNull();
});

test("get project by id throws when no access", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const otherProjectId = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other",
      domain: "other.com",
      createdBy: otherUserId,
    });
    return ctx.db.insert("projects", {
      name: "Other",
      organizationId: otherOrgId,
      isArchived: false,
      createdBy: otherUserId,
    });
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .query(api.projects.queries.getProjectById, {
        projectId: otherProjectId,
      }),
  ).rejects.toThrow("access");
});

test("get archived projects returns only archived projects", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const archivedId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Archived Project",
      organizationId,
      isArchived: true,
      createdBy: userId,
    }),
  );

  const archived = await t
    .withIdentity({ subject: userId })
    .query(api.projects.queries.getArchivedProjects, {});

  expect(archived.some((p) => p._id === archivedId)).toBe(true);
  expect(archived.some((p) => p._id === projectId)).toBe(false);
});
