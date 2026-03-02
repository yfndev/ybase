import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("update user role", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const targetUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "lead@test.com",
      organizationId,
      role: "lead",
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.users.functions.updateUserRole, {
      userId: targetUserId,
      role: "admin",
    });

  const updated = await t.run((ctx) => ctx.db.get(targetUserId));
  expect(updated?.role).toBe("admin");
});

test("cannot remove last admin", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.users.functions.updateUserRole, { userId, role: "lead" }),
  ).rejects.toThrow();
});

test("non-admin cannot update roles", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

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
      .mutation(api.users.functions.updateUserRole, { userId, role: "member" }),
  ).rejects.toThrow();
});

test("add user to organization", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const newUserId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "new@test.com" }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.users.functions.addUserToOrganization, {
      userId: newUserId,
      organizationId,
    });

  const user = await t.run((ctx) => ctx.db.get(newUserId));
  expect(user?.organizationId).toBe(organizationId);
  expect(user?.role).toBe("lead");
});

test("non-admin cannot add user to organization", async () => {
  const t = convexTest(schema, modules);
  const { organizationId } = await setupTestData(t);

  const leadUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "lead@test.com",
      organizationId,
      role: "lead",
    }),
  );

  const newUserId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "new@test.com" }),
  );

  await expect(
    t
      .withIdentity({ subject: leadUserId })
      .mutation(api.users.functions.addUserToOrganization, {
        userId: newUserId,
        organizationId,
      }),
  ).rejects.toThrow();
});

test("cannot add user to different organization", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const { otherOrgId } = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other Org",
      domain: "other.com",
      createdBy: otherUserId,
    });
    return { otherOrgId };
  });

  const newUserId = await t.run((ctx) =>
    ctx.db.insert("users", { email: "new@test.com" }),
  );

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.users.functions.addUserToOrganization, {
        userId: newUserId,
        organizationId: otherOrgId,
      }),
  ).rejects.toThrow("Cannot add users to other organizations");
});

test("update role throws for different org", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const { otherOrgId, otherUserId } = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
      role: "member",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other Org",
      domain: "other.com",
      createdBy: otherUserId,
    });
    await ctx.db.patch(otherUserId, { organizationId: otherOrgId });
    return { otherOrgId, otherUserId };
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.users.functions.updateUserRole, {
        userId: otherUserId,
        role: "admin",
      }),
  ).rejects.toThrow("Access denied");
});

test("update bank details", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.users.functions.updateBankDetails, {
      iban: "DE12345678900000000000",
      bic: "BICTEST",
      accountHolder: "Test User",
    });

  const user = await t.run((ctx) => ctx.db.get(userId));
  expect(user?.iban).toBe("DE12345678900000000000");
});

test("throw error when trying to update role throws for non existing user", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  const targetUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "temp@test.com",
      organizationId,
      role: "member",
    }),
  );

  await t.run((ctx) => ctx.db.delete(targetUserId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.users.functions.updateUserRole, {
        userId: targetUserId,
        role: "admin",
      }),
  ).rejects.toThrow("User not found");
});
