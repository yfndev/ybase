import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("create expected transaction", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId, categoryId } = await setupTestData(t);

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.createExpectedTransaction, {
      projectId,
      date: Date.now(),
      amount: -500,
      description: "Test",
      counterparty: "Test",
      categoryId,
      status: "expected",
    });

  const transaction = await t.run((ctx) => ctx.db.get(id));
  expect(transaction?.status).toBe("expected");
});

test("delete expected transaction", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, categoryId } =
    await setupTestData(t);

  const id = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      categoryId,
      date: Date.now(),
      amount: -100,
      description: "Test",
      counterparty: "Test",
      status: "expected",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.deleteExpectedTransaction, {
      transactionId: id,
    });

  const deleted = await t.run((ctx) => ctx.db.get(id));
  expect(deleted).toBeNull();
});

test("transfer money between projects", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const receivingProjectId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Receiver",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.transferMoney, {
      amount: 500,
      sendingProjectId: projectId,
      receivingProjectId,
    });

  const transactions = await t.run((ctx) =>
    ctx.db.query("transactions").collect(),
  );
  expect(transactions).toHaveLength(2);
});

test("split transaction", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const originalId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 1000,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.splitTransaction, {
      transactionId: originalId,
      splits: [{ projectId, amount: 400 }],
    });

  const original = await t.run((ctx) => ctx.db.get(originalId));
  expect(original?.isArchived).toBe(true);
});

test("imported transaction skips duplicates", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const result1 = await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.createImportedTransaction, {
      date: Date.now(),
      importedTransactionId: "tx123",
      importSource: "sparkasse",
      amount: 100,
      description: "Test",
      counterparty: "Test",
    });
  expect(result1).toEqual({ inserted: true });

  const result2 = await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.createImportedTransaction, {
      date: Date.now(),
      importedTransactionId: "tx123",
      importSource: "sparkasse",
      amount: 100,
      description: "Test",
      counterparty: "Test",
    });
  expect(result2).toEqual({ skipped: true });
});

test("create expected transaction throws error if user has no project access", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, projectId, categoryId } = await setupTestData(t);

  const memberUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "member@test.com",
      organizationId,
      role: "lead",
    }),
  );

  await expect(
    t
      .withIdentity({ subject: memberUserId })
      .mutation(api.transactions.functions.createExpectedTransaction, {
        projectId,
        date: Date.now(),
        amount: -100,
        description: "Test",
        counterparty: "Test",
        categoryId,
        status: "expected",
      }),
  ).rejects.toThrow("Access denied");
});

test("update transaction", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.updateTransaction, {
      transactionId,
      description: "Updated",
    });

  const transaction = await t.run((ctx) => ctx.db.get(transactionId));
  expect(transaction?.description).toBe("Updated");
});

test("update transaction throws error if not in user organization", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const transactionId = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
      role: "admin",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other",
      domain: "other.com",
      createdBy: otherUserId,
    });
    await ctx.db.patch(otherUserId, { organizationId: otherOrgId });
    return ctx.db.insert("transactions", {
      organizationId: otherOrgId,
      date: Date.now(),
      amount: 100,
      description: "Other",
      counterparty: "Test",
      status: "processed",
      importedBy: otherUserId,
    });
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.transactions.functions.updateTransaction, {
        transactionId,
        description: "Hacked",
      }),
  ).rejects.toThrow("Access denied");
});

test("update transaction throws error when no access to current project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const leadUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "lead@test.com",
      organizationId,
      role: "lead",
    }),
  );

  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "Test",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: leadUserId })
      .mutation(api.transactions.functions.updateTransaction, {
        transactionId,
        description: "Updated",
      }),
  ).rejects.toThrow("Access denied");
});

test("update transaction throws error when no access to new project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const otherProjectId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Other",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  const leadUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "lead@test.com",
      organizationId,
      role: "lead",
    }),
  );

  await t.run((ctx) =>
    ctx.db.insert("teams", {
      name: "Team",
      organizationId,
      memberIds: [leadUserId],
      projectIds: [projectId],
      createdBy: userId,
    }),
  );

  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "Test",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: leadUserId })
      .mutation(api.transactions.functions.updateTransaction, {
        transactionId,
        projectId: otherProjectId,
      }),
  ).rejects.toThrow("Access denied");
});

test("split transaction throws error for splitting transactions in wrong organization", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const transactionId = await t.run(async (ctx) => {
    const otherUserId = await ctx.db.insert("users", {
      email: "other@other.com",
      role: "admin",
    });
    const otherOrgId = await ctx.db.insert("organizations", {
      name: "Other",
      domain: "other.com",
      createdBy: otherUserId,
    });
    await ctx.db.patch(otherUserId, { organizationId: otherOrgId });
    return ctx.db.insert("transactions", {
      organizationId: otherOrgId,
      date: Date.now(),
      amount: 1000,
      description: "Other",
      counterparty: "Test",
      status: "processed",
      importedBy: otherUserId,
    });
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.transactions.functions.splitTransaction, {
        transactionId,
        splits: [{ projectId, amount: 500 }],
      }),
  ).rejects.toThrow("Access denied");
});

test("throw error if trying to delete expected transaction without having permission", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "Processed",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.transactions.functions.deleteExpectedTransaction, {
        transactionId,
      }),
  ).rejects.toThrow("Access denied");
});

test("split transaction saves remainding amount in reserves project (Rücklagen)", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const originalId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 1000,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.splitTransaction, {
      transactionId: originalId,
      splits: [{ projectId, amount: 300 }],
    });

  const splits = await t.run((ctx) =>
    ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("splitFromTransactionId"), originalId))
      .collect(),
  );

  expect(splits).toHaveLength(2);
  expect(splits.find((s) => s.amount === 300)?.projectId).toBe(projectId);

  const remainderSplit = splits.find((s) => s.amount === 700);
  expect(remainderSplit).toBeDefined();

  const reservesProject = await t.run((ctx) =>
    ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("name"), "Rücklagen"))
      .first(),
  );
  expect(remainderSplit?.projectId).toBe(reservesProject?._id);
});

test("split transaction without remaining amount creates exact splits", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const otherProjectId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "Other",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  const originalId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 1000,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.splitTransaction, {
      transactionId: originalId,
      splits: [
        { projectId, amount: 600 },
        { projectId: otherProjectId, amount: 400 },
      ],
    });

  const splits = await t.run((ctx) =>
    ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("splitFromTransactionId"), originalId))
      .collect(),
  );

  expect(splits).toHaveLength(2);
});

test("split auto-creates reserves (Rücklagen) project when missing", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const reservesProject = await t.run((ctx) =>
    ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("name"), "Rücklagen"))
      .first(),
  );
  await t.run((ctx) => ctx.db.delete(reservesProject!._id));

  const originalId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 1000,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.splitTransaction, {
      transactionId: originalId,
      splits: [{ projectId, amount: 300 }],
    });

  const newReservesProject = await t.run((ctx) =>
    ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("name"), "Rücklagen"))
      .first(),
  );
  expect(newReservesProject).not.toBeNull();
});

test("matching transaction archives expected transaction", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId, categoryId } =
    await setupTestData(t);

  const expectedId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      categoryId,
      date: Date.now(),
      amount: -100,
      description: "Expected",
      counterparty: "Test",
      status: "expected",
      importedBy: userId,
    }),
  );

  const processedId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: -100,
      description: "Processed",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.updateTransaction, {
      transactionId: processedId,
      matchedTransactionId: expectedId,
    });

  const expected = await t.run((ctx) => ctx.db.get(expectedId));
  expect(expected?.isArchived).toBe(true);
  expect(expected?.matchedTransactionId).toBe(processedId);
});

test("matching already processed transaction does not archive it", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const processedId1 = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: -100,
      description: "Processed 1",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  const processedId2 = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: -100,
      description: "Processed 2",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.updateTransaction, {
      transactionId: processedId2,
      matchedTransactionId: processedId1,
    });

  const matched = await t.run((ctx) => ctx.db.get(processedId1));
  expect(matched?.isArchived).toBeFalsy();
});

test("update transaction without project succeeds for admin", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId } = await setupTestData(t);

  const transactionId = await t.run((ctx) =>
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

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.updateTransaction, {
      transactionId,
      description: "Updated",
    });

  const transaction = await t.run((ctx) => ctx.db.get(transactionId));
  expect(transaction?.description).toBe("Updated");
});

test("update transaction with new projectId succeeds when user has access", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const newProjectId = await t.run((ctx) =>
    ctx.db.insert("projects", {
      name: "New Project",
      organizationId,
      isArchived: false,
      createdBy: userId,
    }),
  );

  await t.run((ctx) =>
    ctx.db.insert("teams", {
      name: "Full Access Team",
      organizationId,
      memberIds: [userId],
      projectIds: [projectId, newProjectId],
      createdBy: userId,
    }),
  );

  const transactionId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      projectId,
      date: Date.now(),
      amount: 100,
      description: "Test",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.transactions.functions.updateTransaction, {
      transactionId,
      projectId: newProjectId,
    });

  const updated = await t.run((ctx) => ctx.db.get(transactionId));
  expect(updated?.projectId).toBe(newProjectId);
});

test("split transaction throws when org is deleted and no reserves project", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const originalId = await t.run((ctx) =>
    ctx.db.insert("transactions", {
      organizationId,
      date: Date.now(),
      amount: 1000,
      description: "Original",
      counterparty: "Test",
      status: "processed",
      importedBy: userId,
    }),
  );

  await t.run(async (ctx) => {
    const reserves = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId),
      )
      .filter((q) => q.eq(q.field("name"), "Rücklagen"))
      .first();
    if (reserves) await ctx.db.delete(reserves._id);
    await ctx.db.delete(organizationId);
  });

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.transactions.functions.splitTransaction, {
        transactionId: originalId,
        splits: [{ projectId, amount: 500 }],
      }),
  ).rejects.toThrow("Organization not found");
});
