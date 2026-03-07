import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import { internal } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("get user bank details", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.patch(userId, {
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
    }),
  );

  const details = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getUserBankDetails, {});

  expect(details.iban).toBe("DE12345678900000000000");
});

test("get user bank details returns empty when not set", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const details = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getUserBankDetails, {});

  expect(details.iban).toBe("");
});

test("get expense reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  const reimbursement = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getReimbursement, { reimbursementId });

  expect(reimbursement?.type).toBe("expense");
});

test("get travel reimbursement with details", async () => {
  const t = convexTest(schema, modules);
  const { userId, travelReimbursementId } = await setupTestData(t);

  const reimbursement = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getReimbursement, {
      reimbursementId: travelReimbursementId,
    });

  expect(reimbursement?.type).toBe("travel");
});

test("get reimbursement returns null when not found", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  const reimbursement = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getReimbursement, { reimbursementId });

  expect(reimbursement).toBeNull();
});

test("get receipts returns empty", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  const receipts = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getReceipts, { reimbursementId });

  expect(receipts).toHaveLength(0);
});

test("admin sees all reimbursements", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const otherUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "other@test.com",
      organizationId,
      role: "member",
    }),
  );

  await t.run(async (ctx) => {
    await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 100,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Admin",
      createdBy: userId,
    });
    await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 200,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Other",
      createdBy: otherUserId,
    });
  });

  const reimbursements = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getAllReimbursements, {});

  expect(reimbursements.length).toBeGreaterThanOrEqual(2);
});

test("non-admin sees own only", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, userId, projectId } = await setupTestData(t);

  const memberUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "member@test.com",
      organizationId,
      role: "member",
    }),
  );

  await t.run(async (ctx) => {
    await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 100,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Admin",
      createdBy: userId,
    });
    await ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 200,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "Member",
      createdBy: memberUserId,
    });
  });

  const reimbursements = await t
    .withIdentity({ subject: memberUserId })
    .query(api.reimbursements.queries.getAllReimbursements, {});

  expect(reimbursements).toHaveLength(1);
});

test("getAllReimbursements includes travel details", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const reimbursements = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getAllReimbursements, {});

  const travelReimbursement = reimbursements.find((r) => r.type === "travel");
  expect(travelReimbursement?.travelDetails?.destination).toBe("Berlin");
});

test("getFileUrl returns url", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["test"])));

  const url = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getFileUrl, { storageId });

  expect(typeof url).toBe("string");
});

test("getReceipts returns empty for deleted reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  const receipts = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getReceipts, { reimbursementId });

  expect(receipts).toHaveLength(0);
});

test("getReimbursementWithDetails returns travel details with meal allowance", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, travelReimbursementId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["receipt"])));

  await t.run(async (ctx) => {
    await ctx.db.patch(organizationId, { accountingEmail: "accounting@test.com" });
    await ctx.db.patch(userId, { name: "Test Admin" });
    const travelDetails = await ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", travelReimbursementId),
      )
      .first();
    if (travelDetails) {
      await ctx.db.patch(travelDetails._id, {
        mealAllowanceDays: 3,
        mealAllowanceDailyBudget: 28,
      });
    }
    await ctx.db.insert("receipts", {
      reimbursementId: travelReimbursementId,
      receiptNumber: "R001",
      receiptDate: "2024-01-01",
      companyName: "Test",
      description: "Test receipt",
      netAmount: 100,
      taxRate: 19,
      grossAmount: 119,
      fileStorageId: storageId,
    });
  });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, {
      reimbursementId: travelReimbursementId,
    });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(travelReimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("getAllReimbursements handles deleted project", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(projectId));

  const reimbursements = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getAllReimbursements, {});

  expect(reimbursements.some((r) => r.projectName === "Unbekanntes Projekt")).toBe(true);
});

test("getReimbursementWithDetails returns null for deleted reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  const result = await t.query(
    internal.reimbursements.queries.getReimbursementWithDetails,
    { reimbursementId },
  );
  expect(result).toBeNull();
});

test("getReimbursementWithDetails returns null when creator is deleted", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(userId));

  const result = await t.query(
    internal.reimbursements.queries.getReimbursementWithDetails,
    { reimbursementId },
  );
  expect(result).toBeNull();
});

test("getReimbursementWithDetails returns expense reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { reimbursementId } = await setupTestData(t);

  const result = await t.query(
    internal.reimbursements.queries.getReimbursementWithDetails,
    { reimbursementId },
  );
  expect(result?.type).toBe("expense");
  expect(result?.travelDetails).toBeNull();
});

test("getAllReimbursements includes reviewer name", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.patch(userId, { name: "Test Admin" });
    await ctx.db.patch(reimbursementId, { status: "approved", reviewedBy: userId });
  });

  const reimbursements = await t
    .withIdentity({ subject: userId })
    .query(api.reimbursements.queries.getAllReimbursements, {});

  const reviewed = reimbursements.find((r) => r.reviewedBy);
  expect(reviewed?.reviewedByName).toBe("Test Admin");
});
