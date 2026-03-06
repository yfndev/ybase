import { convexTest } from "convex-test";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules, setupTestData } from "../test.setup";

const formData = (signatureStorageId: Id<"_storage">, amount = 500) => ({
  amount,
  signatureStorageId,
  iban: "DE12345678900000000000",
  bic: "TESTBIC",
  accountHolder: "Test User",
  activityDescription: "Test Beschreibung",
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  volunteerName: "Max Mustermann",
  volunteerStreet: "Teststr. 1",
  volunteerPlz: "12345",
  volunteerCity: "Berlin",
});

test("create volunteer allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.create, {
      projectId,
      ...formData(storageId),
    });

  const all = await t.run((ctx) =>
    ctx.db.query("volunteerAllowance").collect(),
  );
  expect(all).toHaveLength(1);
  expect(all[0].amount).toBe(500);
});

test("creating fails if amount exceeds 960€", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.volunteerAllowance.functions.create, {
        projectId,
        ...formData(storageId, 961),
      }),
  ).rejects.toThrow("Volunteer allowance cannot exceed 960€");
});

test("approve volunteer allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.approve, { id });

  const doc = await t.run((ctx) => ctx.db.get(id));
  expect(doc?.isApproved).toBe(true);
});

test("reject volunteer allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.reject, {
      id,
      rejectionNote: "Missing docs",
    });

  const doc = await t.run((ctx) => ctx.db.get(id));
  expect(doc?.rejectionNote).toBe("Missing docs");
});

test("remove volunteer allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.remove, { id });

  const doc = await t.run((ctx) => ctx.db.get(id));
  expect(doc).toBeNull();
});

test("remove volunteer allowance without signature", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      amount: 500,
      iban: "DE123",
      bic: "BIC",
      accountHolder: "Test",
      activityDescription: "Test",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      volunteerName: "Max",
      volunteerStreet: "Str",
      volunteerPlz: "12345",
      volunteerCity: "Berlin",
    }),
  );

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.remove, { id });

  const doc = await t.run((ctx) => ctx.db.get(id));
  expect(doc).toBeNull();
});

test("createLink returns id", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });

  expect(typeof id).toBe("string");
});

test("generatePublicUploadUrl with valid id returns url", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });
  const url = await t.mutation(
    api.volunteerAllowance.functions.generatePublicUploadUrl,
    { id },
  );

  expect(typeof url).toBe("string");
});

test("generatePublicUploadUrl fails with invalid id throws error", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );
  await t.run((ctx) => ctx.db.delete(id));

  await expect(
    t.mutation(api.volunteerAllowance.functions.generatePublicUploadUrl, {
      id,
    }),
  ).rejects.toThrow("Invalid link");
});

test("submitExternal completes allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await t.mutation(api.volunteerAllowance.functions.submitExternal, {
    id,
    ...formData(storageId, 400),
  });

  const doc = await t.run((ctx) => ctx.db.get(id));
  expect(doc?.amount).toBe(400);
  expect(doc?.signatureStorageId).toBe(storageId);
});

test("submitExternal fails if amount exceeds 960€", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await expect(
    t.mutation(api.volunteerAllowance.functions.submitExternal, {
      id,
      ...formData(storageId, 961),
    }),
  ).rejects.toThrow("Amount cannot exceed 960€");
});

test("submitExternal fails with invalid link", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );
  await t.run((ctx) => ctx.db.delete(id));

  await expect(
    t.mutation(api.volunteerAllowance.functions.submitExternal, {
      id,
      ...formData(storageId, 400),
    }),
  ).rejects.toThrow("Invalid link");
});

test("createSignatureToken returns token", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const token = await t
    .withIdentity({ subject: userId })
    .mutation(api.signatures.functions.createToken, {});

  expect(typeof token).toBe("string");
});

test("generateSignatureUploadUrl with valid token returns url", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const token = await t
    .withIdentity({ subject: userId })
    .mutation(api.signatures.functions.createToken, {});
  const url = await t.mutation(
    api.signatures.functions.generateUploadUrl,
    { token },
  );

  expect(typeof url).toBe("string");
});

test("submitSignature stores signature", async () => {
  const t = convexTest(schema, modules);
  const { userId } = await setupTestData(t);

  const token = await t
    .withIdentity({ subject: userId })
    .mutation(api.signatures.functions.createToken, {});
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await t.mutation(api.signatures.functions.submit, {
    token,
    signatureStorageId: storageId,
  });

  const doc = await t.run((ctx) =>
    ctx.db
      .query("signatureTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first(),
  );
  expect(doc?.signatureStorageId).toBe(storageId);
});

test("generatePublicUploadUrl fails with already signed allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });

  await t.mutation(api.volunteerAllowance.functions.submitExternal, {
    id,
    ...formData(storageId, 400),
  });

  await expect(
    t.mutation(api.volunteerAllowance.functions.generatePublicUploadUrl, {
      id,
    }),
  ).rejects.toThrow("Already submitted");
});

test("submitExternal fails with already signed allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.createLink, { projectId });

  await t.mutation(api.volunteerAllowance.functions.submitExternal, {
    id,
    ...formData(storageId, 400),
  });

  await expect(
    t.mutation(api.volunteerAllowance.functions.submitExternal, {
      id,
      ...formData(storageId, 400),
    }),
  ).rejects.toThrow("Already submitted");
});

test("generateSignatureUploadUrl fails with expired token", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("signatureTokens", {
      token: "expired-sig-upload",
      organizationId,
      createdBy: userId,
      expiresAt: Date.now() - 1000,
    }),
  );

  await expect(
    t.mutation(api.signatures.functions.generateUploadUrl, {
      token: "expired-sig-upload",
    }),
  ).rejects.toThrow("Link abgelaufen");
});

test("generateSignatureUploadUrl fails with used token", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);

  await t.run((ctx) =>
    ctx.db.insert("signatureTokens", {
      token: "used-sig-upload",
      organizationId,
      createdBy: userId,
      expiresAt: Date.now() + 1000000,
      usedAt: Date.now() - 1000,
    }),
  );

  await expect(
    t.mutation(api.signatures.functions.generateUploadUrl, {
      token: "used-sig-upload",
    }),
  ).rejects.toThrow("Link bereits verwendet");
});

test("generateSignatureUploadUrl fails with invalid token", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);

  await expect(
    t.mutation(api.signatures.functions.generateUploadUrl, {
      token: "invalid",
    }),
  ).rejects.toThrow("Ungültiger Link");
});

test("submitSignature fails with expired token", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await t.run((ctx) =>
    ctx.db.insert("signatureTokens", {
      token: "expired-submit-sig",
      organizationId,
      createdBy: userId,
      expiresAt: Date.now() - 1000,
    }),
  );

  await expect(
    t.mutation(api.signatures.functions.submit, {
      token: "expired-submit-sig",
      signatureStorageId: storageId,
    }),
  ).rejects.toThrow("Link abgelaufen");
});

test("submitSignature fails with used token", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await t.run((ctx) =>
    ctx.db.insert("signatureTokens", {
      token: "used-submit-sig",
      organizationId,
      createdBy: userId,
      expiresAt: Date.now() + 1000000,
      usedAt: Date.now() - 1000,
    }),
  );

  await expect(
    t.mutation(api.signatures.functions.submit, {
      token: "used-submit-sig",
      signatureStorageId: storageId,
    }),
  ).rejects.toThrow("Link bereits verwendet");
});

test("submitSignature fails with invalid token", async () => {
  const t = convexTest(schema, modules);
  await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  await expect(
    t.mutation(api.signatures.functions.submit, {
      token: "invalid",
      signatureStorageId: storageId,
    }),
  ).rejects.toThrow("Ungültiger Link");
});

test("approve fails for non-existent allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );

  await t.run((ctx) => ctx.db.delete(id));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.volunteerAllowance.functions.approve, { id }),
  ).rejects.toThrow("Not found");
});

test("remove fails for non-existent allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      isApproved: false,
      ...formData(storageId),
    }),
  );

  await t.run((ctx) => ctx.db.delete(id));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.volunteerAllowance.functions.remove, { id }),
  ).rejects.toThrow("Not found");
});

const resendModules = import.meta.glob(
  "../../node_modules/@convex-dev/resend/src/component/**/*.ts",
);

const vStatus = v.union(
  v.literal("waiting"),
  v.literal("queued"),
  v.literal("cancelled"),
  v.literal("sent"),
  v.literal("bounced"),
  v.literal("delivered"),
  v.literal("delivery_delayed"),
  v.literal("failed"),
);

const vOptions = v.object({
  apiKey: v.string(),
  testMode: v.boolean(),
  initialBackoffMs: v.number(),
  retryAttempts: v.number(),
  onEmailEvent: v.optional(v.object({ fnHandle: v.string() })),
});

const resendSchema = defineSchema({
  content: defineTable({
    content: v.bytes(),
    mimeType: v.string(),
    filename: v.optional(v.string()),
    path: v.optional(v.string()),
  }),
  nextBatchRun: defineTable({
    runId: v.id("_scheduled_functions"),
  }),
  lastOptions: defineTable({
    options: vOptions,
  }),
  emails: defineTable({
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    replyTo: v.array(v.string()),
    html: v.optional(v.id("content")),
    text: v.optional(v.id("content")),
    headers: v.optional(v.array(v.object({ name: v.string(), value: v.string() }))),
    status: vStatus,
    errorMessage: v.optional(v.string()),
    complained: v.boolean(),
    opened: v.boolean(),
    resendId: v.optional(v.string()),
    segment: v.number(),
    finalizedAt: v.number(),
  })
    .index("by_status_segment", ["status", "segment"])
    .index("by_resendId", ["resendId"])
    .index("by_finalizedAt", ["finalizedAt"]),
});

test("sendAllowanceLink sends email", async () => {
  const t = convexTest(schema, modules);
  t.registerComponent("resend", resendSchema, resendModules);
  const { userId, projectId } = await setupTestData(t);

  await t.run((ctx) =>
    // @ts-expect-error component table
    ctx.db.insert("lastOptions", {
      options: {
        apiKey: "test-api-key",
        testMode: true,
        initialBackoffMs: 1000,
        retryAttempts: 3,
      },
    }),
  );

  const project = await t.run((ctx) => ctx.db.get(projectId));

  await t
    .withIdentity({ subject: userId })
    .mutation(api.volunteerAllowance.functions.sendAllowanceLink, {
      email: "delivered@resend.dev",
      link: "https://example.com/form/123",
      projectName: project!.name,
    });
});

test("approve fails if amount exceeds 960€", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      amount: 961,
      isApproved: false,
      iban: "DE123",
      bic: "BIC",
      accountHolder: "Test",
      activityDescription: "Test",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      volunteerName: "Test",
      volunteerStreet: "Test",
      volunteerPlz: "12345",
      volunteerCity: "Berlin",
      signatureStorageId: storageId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.volunteerAllowance.functions.approve, { id }),
  ).rejects.toThrow("Cannot approve: amount exceeds 960€ legal limit");
});

test("reject fails for non-existent allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      amount: 500,
      isApproved: false,
      iban: "DE123",
      bic: "BIC",
      accountHolder: "Test",
      activityDescription: "Test",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      volunteerName: "Test",
      volunteerStreet: "Test",
      volunteerPlz: "12345",
      volunteerCity: "Berlin",
      signatureStorageId: storageId,
    }),
  );

  await t.run((ctx) => ctx.db.delete(id));

  await expect(
    t
      .withIdentity({ subject: userId })
      .mutation(api.volunteerAllowance.functions.reject, {
        id,
        rejectionNote: "Test",
      }),
  ).rejects.toThrow("Not found");
});

test("non-creator non-admin cannot remove allowance", async () => {
  const t = convexTest(schema, modules);
  const { userId, organizationId, projectId } = await setupTestData(t);
  const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["sig"])));

  const memberUserId = await t.run((ctx) =>
    ctx.db.insert("users", {
      email: "member@test.com",
      organizationId,
      role: "member",
    }),
  );

  const id = await t.run((ctx) =>
    ctx.db.insert("volunteerAllowance", {
      organizationId,
      projectId,
      createdBy: userId,
      amount: 500,
      isApproved: false,
      iban: "DE123",
      bic: "BIC",
      accountHolder: "Test",
      activityDescription: "Test",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      volunteerName: "Test",
      volunteerStreet: "Test",
      volunteerPlz: "12345",
      volunteerCity: "Berlin",
      signatureStorageId: storageId,
    }),
  );

  await expect(
    t
      .withIdentity({ subject: memberUserId })
      .mutation(api.volunteerAllowance.functions.remove, { id }),
  ).rejects.toThrow("Only the creator or an admin can delete");
});
