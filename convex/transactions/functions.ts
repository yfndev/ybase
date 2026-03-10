import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { type MutationCtx, mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { canAccessProject } from "../teams/permissions";
import { requireRole } from "../users/permissions";

export const createExpectedTransaction = mutation({
  args: {
    projectId: v.id("projects"),
    date: v.number(),
    amount: v.number(),
    description: v.string(),
    counterparty: v.string(),
    categoryId: v.id("categories"),
    status: v.literal("expected"),
    donorId: v.optional(v.id("donors")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const hasAccess = await canAccessProject(ctx, user._id, args.projectId);
    if (!hasAccess) throw new Error("Access denied");

    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      importedBy: user._id,
      organizationId: user.organizationId,
    });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "transaction.create",
      transactionId,
      `${args.description} (${args.amount}€)`,
    );
    return transactionId;
  },
});

export const createImportedTransaction = mutation({
  args: {
    date: v.number(),
    bankReferenceId: v.string(),
    importSource: v.union(
      v.literal("sparkasse"),
      v.literal("volksbank"),
      v.literal("moss"),
      v.literal("finom"),
    ),
    amount: v.number(),
    description: v.string(),
    counterparty: v.string(),
    accountName: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");

    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_bankReferenceId", (q) =>
        q
          .eq("organizationId", user.organizationId)
          .eq("bankReferenceId", args.bankReferenceId),
      )
      .first();

    if (existing) return { skipped: true };

    await ctx.db.insert("transactions", {
      ...args,
      organizationId: user.organizationId,
      importedBy: user._id,
      status: "processed",
    });

    return { inserted: true };
  },
});

export const updateTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    date: v.optional(v.number()),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    counterparty: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    categoryId: v.optional(v.id("categories")),
    donorId: v.optional(v.id("donors")),
    matchedTransactionId: v.optional(v.id("transactions")),
    status: v.optional(v.union(v.literal("expected"), v.literal("processed"))),
  },
  handler: async (ctx, { transactionId, ...updates }) => {
    const user = await requireRole(ctx, "lead");

    const transaction = await ctx.db.get(transactionId);
    if (!transaction || transaction.organizationId !== user.organizationId)
      throw new Error("Access denied");

    if (transaction.projectId) {
      const hasAccess = await canAccessProject(
        ctx,
        user._id,
        transaction.projectId,
      );
      if (!hasAccess) throw new Error("Access denied");
    }

    if (updates.projectId) {
      const hasAccess = await canAccessProject(
        ctx,
        user._id,
        updates.projectId,
      );
      if (!hasAccess) throw new Error("Access denied");
    }

    await ctx.db.patch(transactionId, updates);

    if (updates.matchedTransactionId) {
      const matched = await ctx.db.get(updates.matchedTransactionId);
      if (matched?.status === "expected") {
        await ctx.db.patch(matched._id, {
          isArchived: true,
          matchedTransactionId: transactionId,
        });
      }
    }

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "transaction.update",
      transactionId,
      transaction.description,
    );
  },
});

export const deleteExpectedTransaction = mutation({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");

    const transaction = await ctx.db.get(args.transactionId);
    if (
      !transaction ||
      transaction.organizationId !== user.organizationId ||
      transaction.status !== "expected"
    )
      throw new Error("Access denied");

    await ctx.db.delete(args.transactionId);
    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "transaction.delete",
      args.transactionId,
      `${transaction.description} (${transaction.amount}€)`,
    );
  },
});

export const splitTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    splits: v.array(
      v.object({ projectId: v.id("projects"), amount: v.number() }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const original = await ctx.db.get(args.transactionId);

    if (!original || original.organizationId !== user.organizationId)
      throw new Error("Access denied");

    if (original.amount <= 0) {
      throw new Error("Can only split positive transactions");
    }

    for (const split of args.splits) {
      if (split.amount <= 0) {
        throw new Error("Split amounts must be positive");
      }
    }

    const total = args.splits.reduce((sum, split) => sum + split.amount, 0);

    if (total > original.amount) {
      throw new Error("Split total exceeds transaction amount");
    }

    await ctx.db.patch(args.transactionId, { isArchived: true });

    const remainder = original.amount - total;

    const allSplits =
      remainder > 0
        ? [
            ...args.splits,
            {
              projectId: await getReservesProjectId(
                ctx,
                original.organizationId,
              ),
              amount: remainder,
            },
          ]
        : args.splits;

    for (const split of allSplits) {
      await ctx.db.insert("transactions", {
        organizationId: original.organizationId,
        date: original.date,
        counterparty: original.counterparty,
        status: "processed",
        importedBy: original.importedBy,
        categoryId: original.categoryId,
        donorId: original.donorId,
        accountName: original.accountName,
        bankReferenceId: original.bankReferenceId,
        importSource: original.importSource,
        splitFromTransactionId: args.transactionId,
        isArchived: false,
        projectId: split.projectId,
        amount: split.amount,
        description: `(Split) ${original.description} `,
      });
    }
  },
});

async function getReservesProjectId(
  ctx: MutationCtx,
  organizationId: Id<"organizations">,
) {
  const reserves = await ctx.db
    .query("projects")
    .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
    .filter((q) =>
      q.and(
        q.eq(q.field("name"), "Rücklagen"),
        q.eq(q.field("parentId"), undefined),
      ),
    )
    .first();

  if (reserves) return reserves._id;

  const org = await ctx.db.get(organizationId);
  if (!org) throw new Error("Organization not found");

  return ctx.db.insert("projects", {
    name: "Rücklagen",
    organizationId,
    isArchived: false,
    createdBy: org.createdBy,
  });
}

export const transferMoney = mutation({
  args: {
    amount: v.number(),
    sendingProjectId: v.id("projects"),
    receivingProjectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");

    const sendingProject = await ctx.db.get(args.sendingProjectId);
    const receivingProject = await ctx.db.get(args.receivingProjectId);

    const transferId = crypto.randomUUID();
    const base = {
      date: Date.now(),
      importedBy: user._id,
      organizationId: user.organizationId,
      description: `Budgetübertrag von ${sendingProject?.name} zu ${receivingProject?.name}`,
      counterparty: "Internal Transfer",
      status: "processed" as const,
      transferId,
    };

    const sendingId = await ctx.db.insert("transactions", {
      ...base,
      amount: -args.amount,
      projectId: args.sendingProjectId,
    });
    await ctx.db.insert("transactions", {
      ...base,
      amount: args.amount,
      projectId: args.receivingProjectId,
    });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "transaction.transfer",
      sendingId,
      `${args.amount}€: ${sendingProject?.name} → ${receivingProject?.name}`,
    );
  },
});
