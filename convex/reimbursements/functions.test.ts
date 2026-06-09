import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

test("create (standard) reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const sigId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const reimbursementId = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.createReimbursement, {
      amount: 100,
      projectId,
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
      signatureStorageId: sigId,
      receipts: [],
    });

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.type).toBe("expense");
  expect(reimbursement?.status).toBe("pending");
});

test("create travel reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const sigId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const reimbursementId = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.createTravelReimbursement, {
      amount: 200,
      projectId,
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
      signatureStorageId: sigId,
      startDate: "2024-01-01",
      endDate: "2024-01-02",
      destination: "Berlin",
      purpose: "Conference",
      isInternational: false,
      receipts: [],
    });

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.type).toBe("travel");

  const travelDetails = await t.run((ctx) =>
    ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", reimbursementId),
      )
      .first(),
  );
  expect(travelDetails?.destination).toBe("Berlin");
});

test("delete reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.deleteReimbursement, {
      reimbursementId,
    });

  const deleted = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(deleted).toBeNull();
});

test("mark reimbursement as paid", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.patch(organizationId, { accountingEmail: "accounting@test.com" }),
  );
  await t.run((ctx) =>
    ctx.db.patch(userId, { name: "Test Admin", email: "test@test.com" }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("reject reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.decline, {
      reimbursementId,
      rejectionNote: "Missing receipt",
    });

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.rejectionNote).toBe("Missing receipt");
});

test("generate upload url", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const url = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.generateUploadUrl, {});

  expect(typeof url).toBe("string");
});

test("throw error if trying to delete non existent reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.reimbursements.functions.deleteReimbursement, {
        reimbursementId,
      }),
  ).rejects.toThrow("Reimbursement not found");
});

test("throw error if trying to mark non existent reimbursement as paid", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.reimbursements.functions.approve, { reimbursementId }),
  ).rejects.toThrow("Reimbursement not found");
});

test("throw error if trying to reject non existent reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.reimbursements.functions.decline, {
        reimbursementId,
        rejectionNote: "Test",
      }),
  ).rejects.toThrow("Reimbursement not found");
});

test("delete travel reimbursement deletes travel details", async () => {
  const t = convexTest(schema, modules);
  const { userId, travelReimbursementId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.deleteReimbursement, {
      reimbursementId: travelReimbursementId,
    });

  const details = await t.run((ctx) =>
    ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", travelReimbursementId),
      )
      .first(),
  );
  expect(details).toBeNull();
});

test("create reimbursement with receipts", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["test"])));

  const reimbursementId = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.createReimbursement, {
      amount: 150,
      projectId,
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
      signatureStorageId: storageId,
      receipts: [
        {
          receiptNumber: "R001",
          receiptDate: "2024-01-15",
          companyName: "Test Company",
          description: "Office supplies",
          netAmount: 100,
          taxRate: 19,
          grossAmount: 119,
          fileStorageId: storageId,
        },
      ],
    });

  const receipts = await t.run((ctx) =>
    ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", reimbursementId),
      )
      .collect(),
  );
  expect(receipts).toHaveLength(1);
  expect(receipts[0].receiptNumber).toBe("R001");
});

test("create travel reimbursement with meal allowance and receipts", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["test"])));

  const reimbursementId = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.createTravelReimbursement, {
      amount: 500,
      projectId,
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
      signatureStorageId: storageId,
      startDate: "2024-01-01",
      endDate: "2024-01-03",
      destination: "Munich",
      purpose: "Business Meeting",
      isInternational: true,
      mealAllowanceDays: 3,
      mealAllowanceDailyBudget: 28,
      receipts: [
        {
          receiptNumber: "T001",
          receiptDate: "2024-01-01",
          companyName: "Deutsche Bahn",
          description: "Train ticket",
          netAmount: 80,
          taxRate: 7,
          grossAmount: 85.6,
          fileStorageId: storageId,
          costType: "train",
        },
      ],
    });

  const travelDetails = await t.run((ctx) =>
    ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", reimbursementId),
      )
      .first(),
  );
  expect(travelDetails?.mealAllowanceDays).toBe(3);
  expect(travelDetails?.mealAllowanceDailyBudget).toBe(28);
  expect(travelDetails?.isInternational).toBe(true);

  const receipts = await t.run((ctx) =>
    ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", reimbursementId),
      )
      .collect(),
  );
  expect(receipts).toHaveLength(1);
  expect(receipts[0].costType).toBe("train");
});

test("non-creator non-admin cannot delete reimbursement", async () => {
  const t = convexTest(schema, modules);
  const { organizationId, reimbursementId } = await setupTestData(t);

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
      .mutation(api.reimbursements.functions.deleteReimbursement, {
        reimbursementId,
      }),
  ).rejects.toThrow("Only the creator or an admin can delete reimbursements");
});

test("delete reimbursement with receipts deletes receipt records", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["test"])));

  const reimbursementId = await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.createReimbursement, {
      amount: 100,
      projectId,
      iban: "DE12345678900000000000",
      bic: "TESTBIC",
      accountHolder: "Test User",
      signatureStorageId: storageId,
      receipts: [
        {
          receiptNumber: "R001",
          receiptDate: "2024-01-15",
          companyName: "Test",
          description: "Test",
          netAmount: 100,
          taxRate: 19,
          grossAmount: 119,
          fileStorageId: storageId,
        },
      ],
    });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.deleteReimbursement, {
      reimbursementId,
    });

  const receipts = await t.run((ctx) =>
    ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", reimbursementId),
      )
      .collect(),
  );
  expect(receipts).toHaveLength(0);
});

test("approve still works when project is deleted", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, projectId, reimbursementId } = await setupTestData(t);

  await t.run((ctx) => ctx.db.delete(projectId));

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("mark travel reimbursement as paid without meal allowance and no creator name", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, travelReimbursementId } =
    await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.patch(organizationId, {
      accountingEmail: "accounting@test.com",
    });
  });

  const storageId = await t.run((ctx) =>
    ctx.storage.store(new Blob(["receipt"])),
  );

  await t.run(async (ctx) => {
    await ctx.db.insert("receipts", {
      reimbursementId: travelReimbursementId,
      receiptNumber: "T001",
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

  const reimbursement = await t.run((ctx) =>
    ctx.db.get(travelReimbursementId),
  );
  expect(reimbursement?.status).toBe("approved");
});

test("mark travel reimbursement as paid with meal allowance days but no daily budget", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, travelReimbursementId } =
    await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.patch(organizationId, {
      accountingEmail: "accounting@test.com",
    });
    await ctx.db.patch(userId, { name: "Test Admin" });
    const travelDetails = await ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", travelReimbursementId),
      )
      .first();
    if (travelDetails) {
      await ctx.db.patch(travelDetails._id, { mealAllowanceDays: 2 });
    }
  });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, {
      reimbursementId: travelReimbursementId,
    });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) =>
    ctx.db.get(travelReimbursementId),
  );
  expect(reimbursement?.status).toBe("approved");
});

test("approve sends no email when org has no accounting email", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, reimbursementId } = await setupTestData(t);

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("sendApprovalEmail skips receipt with deleted storage file", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, reimbursementId } = await setupTestData(t);

  const storageId = await t.run((ctx) =>
    ctx.storage.store(new Blob(["test"])),
  );

  await t.run(async (ctx) => {
    await ctx.db.patch(organizationId, {
      accountingEmail: "accounting@test.com",
    });
    await ctx.db.patch(userId, { name: "Test Admin" });
    await ctx.db.insert("receipts", {
      reimbursementId,
      receiptNumber: "R001",
      receiptDate: "2024-01-01",
      companyName: "Test",
      description: "Test",
      netAmount: 100,
      taxRate: 19,
      grossAmount: 119,
      fileStorageId: storageId,
    });
    await ctx.storage.delete(storageId);
  });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("sendApprovalEmail sends without cc when creator has no email", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { organizationId, projectId } = await setupTestData(t);

  const noEmailUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      organizationId,
      role: "admin",
      name: "No Email User",
    }),
  );

  const reimbursementId = await t.run((ctx) =>
    ctx.db.insert("reimbursements", {
      organizationId,
      projectId,
      amount: 50,
      type: "expense",
      status: "pending",
      iban: "DE12340000000000000000",
      bic: "BIC",
      accountHolder: "No Email",
      createdBy: noEmailUserId,
    }),
  );

  await t.run((ctx) =>
    ctx.db.patch(organizationId, {
      accountingEmail: "accounting@test.com",
    }),
  );

  await t
    .withIdentity({ subject: noEmailUserId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const reimbursement = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(reimbursement?.status).toBe("approved");
});

test("sendApprovalEmail handles deleted reimbursement gracefully", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema, modules);
  const { userId, organizationId, reimbursementId } = await setupTestData(t);

  await t.run(async (ctx) => {
    await ctx.db.patch(organizationId, {
      accountingEmail: "accounting@test.com",
    });
    await ctx.db.patch(userId, { name: "Test Admin" });
  });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.approve, { reimbursementId });

  await t.run((ctx) => ctx.db.delete(reimbursementId));

  await t.finishAllScheduledFunctions(vi.runAllTimers);
  vi.useRealTimers();

  const deleted = await t.run((ctx) => ctx.db.get(reimbursementId));
  expect(deleted).toBeNull();
});

test("delete travel reimbursement without travel details row", async () => {
  const t = convexTest(schema, modules);
  const { userId, travelReimbursementId } = await setupTestData(t);

  await t.run(async (ctx) => {
    const details = await ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) =>
        q.eq("reimbursementId", travelReimbursementId),
      )
      .first();
    if (details) await ctx.db.delete(details._id);
  });

  await t
    .withIdentity({ subject: userId })
    .mutation(api.reimbursements.functions.deleteReimbursement, {
      reimbursementId: travelReimbursementId,
    });

  const deleted = await t.run((ctx) => ctx.db.get(travelReimbursementId));
  expect(deleted).toBeNull();
});
