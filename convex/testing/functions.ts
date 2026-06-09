import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { createAccount } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation, type MutationCtx } from "../_generated/server";

export const TestingCredentials = ConvexCredentials({
  id: "testing",
  authorize: async (credentials, ctx): Promise<{ userId: Id<"users"> }> => {
    if (!process.env.IS_TEST)
      throw new ConvexError(
        "Testing provider is only available in test environment",
      );

    const email = credentials.email as string | undefined;
    if (!email)
      throw new ConvexError("Email is required for testing authentication");

    const { user } = await createAccount(ctx, {
      provider: "testing",
      account: { id: email },
      profile: {
        email,
        name: (credentials.name as string) ?? "Test User",
        emailVerificationTime: Date.now(),
      },
      shouldLinkViaEmail: true,
    });

    return { userId: user._id as Id<"users"> };
  },
});

async function deleteUserAuth(ctx: MutationCtx, userId: Id<"users">) {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .collect();
  for (const s of sessions) await ctx.db.delete(s._id);

  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
    .collect();
  for (const a of accounts) await ctx.db.delete(a._id);
}

async function deleteOrganization(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
) {
  const reimbursements = await ctx.db
    .query("reimbursements")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .collect();

  for (const r of reimbursements) {
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", r._id))
      .collect();
    for (const receipt of receipts) {
      if (receipt.fileStorageId)
        await ctx.storage.delete(receipt.fileStorageId);
      await ctx.db.delete(receipt._id);
    }

    const details = await ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", r._id))
      .collect();
    for (const d of details) await ctx.db.delete(d._id);

    await ctx.db.delete(r._id);
  }

  const allowances = await ctx.db
    .query("volunteerAllowance")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .collect();
  for (const a of allowances) {
    if (a.signatureStorageId) await ctx.storage.delete(a.signatureStorageId);
    await ctx.db.delete(a._id);
  }

  for (const table of ["projects", "logs"] as const) {
    const docs = await ctx.db
      .query(table)
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId),
      )
      .collect();
    for (const doc of docs) await ctx.db.delete(doc._id);
  }

  const users = await ctx.db
    .query("users")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .collect();
  for (const user of users) {
    await deleteUserAuth(ctx, user._id);
    await ctx.db.delete(user._id);
  }

  await ctx.db.delete(organizationId);
}

export const clearTestData = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    if (!process.env.IS_TEST)
      throw new ConvexError("Only available in test environment");

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", email.split("@")[1]))
      .first();

    if (org) await deleteOrganization(ctx, org._id);

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (user) {
      await deleteUserAuth(ctx, user._id);
      await ctx.db.delete(user._id);
    }
  },
});

export const createMockProjects = mutation({
  args: { email: v.string(), count: v.number() },
  handler: async (ctx, { email, count }) => {
    if (!process.env.IS_TEST)
      throw new ConvexError("Only available in test environment");

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();
    if (!user?.organizationId) throw new ConvexError("User not found");

    for (let i = 0; i < count; i++) {
      await ctx.db.insert("projects", {
        name: `Test Project ${i + 1}`,
        organizationId: user.organizationId,
        isArchived: false,
        createdBy: user._id,
      });
    }
  },
});
