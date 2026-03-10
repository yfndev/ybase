import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("return existing organization when user already has one", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const result = await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.initializeOrganization, {});

  expect(result.organizationId).toBe(organizationId);
  expect(result.isNew).toBe(false);
});

test("add user to existing organization by domain", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const newUserId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "newuser@test.com" }),
  );

  const result = await t
    .withIdentity({ subject: newUserId })
    .mutation(api.organizations.functions.initializeOrganization, {});

  expect(result.organizationId).toBe(organizationId);

  const user = await t.run((ctx) => ctx.db.get(newUserId));
  expect(user?.role).toBe("member");
});

test("create new organization with reserves project", async () => {
  const t = convexTest(schema, modules);

  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "user@newdomain.com" }),
  );

  const result = await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.initializeOrganization, {
      organizationName: "New Test Organization",
    });

  expect(result.isNew).toBe(true);

  const org = await t.run((ctx) => ctx.db.get(result.organizationId));
  expect(org?.name).toBe("New Test Organization");

  const project = await t.run((ctx) =>
    ctx.db
      .query("projects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", result.organizationId),
      )
      .first(),
  );
  expect(project?.name).toBe("Rücklagen");
});

test("throw error when email has no @ (can't split domain)", async () => {
  const t = convexTest(schema, modules);

  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "maxmustermann" }),
  );

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.organizations.functions.initializeOrganization, {}),
  ).rejects.toThrow("Could not find a domain for this E-Mail");
});

test("use domain as fallback name", async () => {
  const t = convexTest(schema, modules);

  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "user@fallback.com" }),
  );

  const result = await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.initializeOrganization, {});

  const org = await t.run((ctx) => ctx.db.get(result.organizationId));
  expect(org?.name).toBe("fallback.com Organization");
});

test("throw error for unauthenticated user", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  await expect(
    t.mutation(api.organizations.functions.initializeOrganization, {}),
  ).rejects.toThrow("Unauthorized");
});

test("throw error when user not found in database", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(userId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.organizations.functions.initializeOrganization, {}),
  ).rejects.toThrow("User not found");
});

test("update organization", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.updateOrganization, {
      name: "Updated Name",
      street: "Teststr. 1",
      plz: "12345",
      city: "Berlin",
      accountingEmail: "accounting@test.com",
    });

  const org = await t.run((ctx) => ctx.db.get(organizationId));
  expect(org?.name).toBe("Updated Name");
  expect(org?.street).toBe("Teststr. 1");
  expect(org?.accountingEmail).toBe("accounting@test.com");
});

test("update organization with partial fields", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.updateOrganization, {
      name: "Only Name",
    });

  const org = await t.run((ctx) => ctx.db.get(organizationId));
  expect(org?.name).toBe("Only Name");
  expect(org?.street).toBeUndefined();
});

test("update organization without name only updates provided fields", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.organizations.functions.updateOrganization, {
      street: "Neue Str. 2",
    });

  const org = await t.run((ctx) => ctx.db.get(organizationId));
  expect(org?.name).toBe("Test Organization");
  expect(org?.street).toBe("Neue Str. 2");
});

test("update organization throws when org is deleted", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(organizationId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.organizations.functions.updateOrganization, {
        name: "Nope",
      }),
  ).rejects.toThrow("Organization not found");
});
