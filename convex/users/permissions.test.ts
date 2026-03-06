import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("admin can call admin function", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const teamId = await t
    .withIdentity({ subject: userId })
    .mutation(api.teams.functions.createTeam, { name: "Test Team" });

  expect(teamId).toBeDefined();
});

test("member cannot call admin function", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const memberUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "member@test.com",
      organizationId,
      role: "member",
    }),
  );

  await expect(
    t
      .withIdentity({ subject: memberUserId })
      .mutation(api.teams.functions.createTeam, { name: "Test Team" }),
  ).rejects.toThrow("Insufficient permissions");
});

test("lead cannot call admin function", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const leadUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "lead@test.com",
      organizationId,
      role: "lead",
    }),
  );

  await expect(
    t
      .withIdentity({ subject: leadUserId })
      .mutation(api.teams.functions.createTeam, { name: "Test Team" }),
  ).rejects.toThrow("Insufficient permissions");
});

test("user without explicit role defaults to member", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const noRoleUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "norole@test.com",
      organizationId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: noRoleUserId })
      .mutation(api.teams.functions.createTeam, { name: "Test" }),
  ).rejects.toThrow("Insufficient permissions");
});

test("user without organization cannot call protected functions", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  const noOrgUserId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "noorg@test.com" }),
  );

  await expect(
    t
      .withIdentity({ subject: noOrgUserId })
      .mutation(api.teams.functions.createTeam, { name: "Test" }),
  ).rejects.toThrow("User has no organization");
});

test("unauthenticated user cannot call protected functions", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  await expect(
    t.mutation(api.teams.functions.createTeam, { name: "Test" }),
  ).rejects.toThrow("Unauthorized");
});

test("deleted user cannot call protected functions", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(userId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.teams.functions.createTeam, { name: "Test" }),
  ).rejects.toThrow("User not found");
});
