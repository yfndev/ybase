import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("get all donors", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const donors = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getAllDonors, {});

  expect(donors).toHaveLength(1);
});

test("get donors by project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, donorId } = await setupTestData(t);

  // transaction is necessary as donor only gets returned if there is a transaction
  await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      donorId,
      date: Date.now(),
      amount: 100,
      description: "Donation",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    }),
  );

  const donors = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorsByProject, { projectId });

  expect(donors).toHaveLength(1);
});

test("get transactions", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, donorId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      donorId,
      date: Date.now(),
      amount: 100,
      description: "Test",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    }),
  );

  const transactions = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorTransactions, { donorId });

  expect(transactions).toHaveLength(1);
});

test("calculate income using getDonorById", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, donorId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("transactions", {
      organizationId,
      donorId,
      date: Date.now(),
      amount: 500,
      description: "Expected",
      counterparty: "Donor",
      status: "expected",
      importedBy: userId,
    });
    await ctx.db.insert("transactions", {
      organizationId,
      donorId,
      date: Date.now(),
      amount: 300,
      description: "Paid",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    });
  });

  const donor = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorById, { donorId });

  expect(donor?.committedIncome).toBe(800);
  expect(donor?.paidIncome).toBe(300);
  expect(donor?.availableBudget).toBe(300);
});

test("throw error when no donor is found by id", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, donorId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(donorId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .query(api.donors.queries.getDonorById, { donorId }),
  ).rejects.toThrow("Donor not found");
});

test("throw error if donor is not in user organization", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const otherDonorId = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other",
      domain: "other.com",
      createdBy: otherUserId,
    });
    return ctx.db.insert("donors", {
      name: "Donor",
      type: "donation",
      allowedTaxSpheres: ["non-profit"],
      organizationId: otherOrgId,
      createdBy: otherUserId,
    });
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .query(api.donors.queries.getDonorById, { donorId: otherDonorId }),
  ).rejects.toThrow("Unauthorized");
});

test("calculate available budget with expenses", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, donorId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("transactions", {
      organizationId,
      donorId,
      date: Date.now(),
      amount: 1000,
      description: "Income",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    });
    await ctx.db.insert("transactions", {
      organizationId,
      donorId,
      date: Date.now(),
      amount: -200,
      description: "Expense",
      counterparty: "Vendor",
      status: "processed",
      importedBy: userId,
    });
  });

  const donor = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorById, { donorId });

  expect(donor?.availableBudget).toBe(800);
});

test("get donors by project ignores transactions without donorId", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, donorId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("transactions", {
      organizationId,
      projectId,
      donorId,
      date: Date.now(),
      amount: 100,
      description: "With donor",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    });
    await ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 50,
      description: "Without donor",
      counterparty: "Someone",
      status: "processed",
      importedBy: userId,
    });
  });

  const donors = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorsByProject, { projectId });

  expect(donors).toHaveLength(1);
  expect(donors?.[0]?._id).toBe(donorId);
});

test("get donors by project handles deleted donor", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, donorId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.insert("transactions", {
      organizationId,
      projectId,
      donorId,
      date: Date.now(),
      amount: 100,
      description: "Donation",
      counterparty: "Donor",
      status: "processed",
      importedBy: userId,
    });
  });

  await t.run((ctx) => ctx.db.delete(donorId));

  const donors = await t
    .withIdentity({ subject: userId })
    .query(api.donors.queries.getDonorsByProject, { projectId });

  expect(donors).toHaveLength(0);
});
