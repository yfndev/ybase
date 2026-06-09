import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("create project", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const projectId = await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.createProject, { name: "New Project" });

  const project = await t.run((ctx) => ctx.db.get(projectId));
  expect(project?.name).toBe("New Project");
});

test("rename project", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.renameProject, {
      projectId,
      name: "Renamed",
    });

  const project = await t.run((ctx) => ctx.db.get(projectId));
  expect(project?.name).toBe("Renamed");
});

test("archive project", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.archiveProject, { projectId });

  const project = await t.run((ctx) => ctx.db.get(projectId));
  expect(project?.isArchived).toBe(true);
});

test("rename project throws error if project is not found", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(projectId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.projects.functions.renameProject, {
        projectId,
        name: "New",
      }),
  ).rejects.toThrow("not found");
});

test("rename project throws for wrong organization", async () => {
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
      .mutation(api.projects.functions.renameProject, {
        projectId: otherProjectId,
        name: "New",
      }),
  ).rejects.toThrow("denied");
});

test("unarchive project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const archivedId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Archived",
      organizationId,
      isArchived: true,
      createdBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.unarchiveProject, {
      projectId: archivedId,
    });

  const project = await t.run((ctx) => ctx.db.get(archivedId));
  expect(project?.isArchived).toBe(false);
});

test("delete project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const projectId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "To delete",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.deleteProject, { projectId });

  const project = await t.run((ctx) => ctx.db.get(projectId));
  expect(project).toBeNull();
});

test("delete project merges reimbursements into target", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, reimbursementId } =
    await setupTestData(t);

  const targetId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Target",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.projects.functions.deleteProject, {
      projectId,
      mergeIntoProjectId: targetId,
    });

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.projectId).toBe(targetId);
});

test("unarchive project throws if project not found", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(projectId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.projects.functions.unarchiveProject, { projectId }),
  ).rejects.toThrow("not found");
});

test("unarchive project throws for wrong organization", async () => {
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
      isArchived: true,
      createdBy: otherUserId,
    });
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.projects.functions.unarchiveProject, {
        projectId: otherProjectId,
      }),
  ).rejects.toThrow("denied");
});
