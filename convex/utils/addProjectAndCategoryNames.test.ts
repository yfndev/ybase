import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("adds project and category names", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, categoryId } =
    await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      categoryId,
      date: Date.now(),
      amount: 100,
      description: "Test",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  const transactions = await t
    .withIdentity({ subject: userId })
    .query(api.transactions.queries.getAllTransactions, {});

  expect(transactions[0].projectName).toBe("Test Project");
  expect(transactions[0].categoryName).toBe("Test Category");
});

test("handles missing category", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "No category",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  const transactions = await t
    .withIdentity({ subject: userId })
    .query(api.transactions.queries.getAllTransactions, {});

  expect(transactions[0].categoryName).toBeUndefined();
});

test("handles missing project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 100,
      description: "No project",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  const transactions = await t
    .withIdentity({ subject: userId })
    .query(api.transactions.queries.getAllTransactions, {});

  const noProject = transactions.find((tx) => !tx.projectId);
  expect(noProject?.projectName).toBeUndefined();
});
