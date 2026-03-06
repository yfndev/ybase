import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("getOrganizationByDomain returns existing org", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const result = await t
    .withIdentity({ subject: userId })
    .query(api.organizations.queries.getOrganizationByDomain, {});

  expect(result.exists).toBe(true);
});

test("getOrganizationByDomain returns false when no email", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const userIdNoEmail = await t.run((ctx) =>
    ctx.db.insert("users", { organizationId }),
  );

  const result = await t
    .withIdentity({ subject: userIdNoEmail })
    .query(api.organizations.queries.getOrganizationByDomain, {});

  expect(result.exists).toBe(false);
});

test("getOrganizationByDomain returns false for unknown domain", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const userIdOtherDomain = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "user@otherdomain.com",
      organizationId,
    }),
  );

  const result = await t
    .withIdentity({ subject: userIdOtherDomain })
    .query(api.organizations.queries.getOrganizationByDomain, {});

  expect(result.exists).toBe(false);
});

test("getOrganizationByDomain returns false for unauthenticated user", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  const result = await t.query(
    api.organizations.queries.getOrganizationByDomain,
    {},
  );

  expect(result.exists).toBe(false);
});

test("getOrganizationByDomain returns false for email without domain", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const userIdBadEmail = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "nodomain",
      organizationId,
    }),
  );

  const result = await t
    .withIdentity({ subject: userIdBadEmail })
    .query(api.organizations.queries.getOrganizationByDomain, {});

  expect(result.exists).toBe(false);
});

test("getOrganization returns org details", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const org = await t
    .withIdentity({ subject: userId })
    .query(api.organizations.queries.getOrganization, {});

  expect(org.name).toBe("Test Organization");
});

test("getOrganization throws when org is deleted", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(organizationId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .query(api.organizations.queries.getOrganization, {}),
  ).rejects.toThrow("Organization not found");
});
