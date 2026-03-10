import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { calculateBudget } from "../lib/budgetCalculations";
import { filterByProjectAccess } from "../teams/permissions";
import { getCurrentUser } from "../users/getCurrentUser";
import { addProjectAndCategoryNames } from "../utils/addProjectAndCategoryNames";

export const getAllTransactions = query({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.organizationId) return [];

    const organizationId = user.organizationId;
    const query = args.projectId
      ? ctx.db
          .query("transactions")
          .withIndex("by_organization_project", (q) =>
            q
              .eq("organizationId", organizationId)
              .eq("projectId", args.projectId),
          )
      : ctx.db
          .query("transactions")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", organizationId),
          );

    const allTransactions = await query.collect();
    const transactions = allTransactions.filter(
      (transaction) => !transaction.isArchived,
    );

    const filtered = await filterByProjectAccess(
      ctx,
      user._id,
      organizationId,
      transactions,
    );
    return addProjectAndCategoryNames(ctx, filtered);
  },
});

export const getUnassignedProcessedTransactions = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user.role !== "admin") return [];

    const processed = await ctx.db
      .query("transactions")
      .withIndex("by_organization_status", (q) =>
        q.eq("organizationId", user.organizationId).eq("status", "processed"),
      )
      .collect();

    return processed
      .filter(
        (transaction) =>
          !transaction.isArchived &&
          !transaction.splitFromTransactionId &&
          !transaction.transferId &&
          (!transaction.projectId ||
            !transaction.categoryId ||
            (transaction.amount > 0 && !transaction.donorId)),
      )
      .sort((a, b) => b.date - a.date);
  },
});

export const getOldestTransactionDate = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const oldest = await ctx.db
      .query("transactions")
      .withIndex("by_organization_date", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("projectId"), undefined),
          q.neq(q.field("isArchived"), true),
        ),
      )
      .order("asc")
      .first();

    return oldest?.date ?? Date.now();
  },
});

export const getMatchingRecommendations = query({
  args: {
    projectId: v.optional(v.id("projects")),
    isExpense: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const query = args.projectId
      ? ctx.db
          .query("transactions")
          .withIndex("by_organization_project", (q) =>
            q
              .eq("organizationId", user.organizationId)
              .eq("projectId", args.projectId),
          )
      : ctx.db
          .query("transactions")
          .withIndex("by_organization_status", (q) =>
            q
              .eq("organizationId", user.organizationId)
              .eq("status", "expected"),
          );

    const allTransactions = await query.collect();
    const unmatched = allTransactions.filter((transaction) => {
      if (
        transaction.status !== "expected" ||
        !transaction.projectId ||
        transaction.matchedTransactionId
      )
        return false;
      if (args.isExpense === undefined) return true;
      return args.isExpense ? transaction.amount < 0 : transaction.amount > 0;
    });

    const filtered = await filterByProjectAccess(
      ctx,
      user._id,
      user.organizationId,
      unmatched,
    );
    return addProjectAndCategoryNames(ctx, filtered);
  },
});

export const getProjectBudget = query({
  args: {
    projectIds: v.array(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const allTransactions: Array<{ amount: number; status: string }> = [];

    for (const projectId of args.projectIds) {
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_organization_project", (q) =>
          q
            .eq("organizationId", user.organizationId)
            .eq("projectId", projectId),
        )
        .collect();

      for (const transaction of transactions) {
        if (transaction.isArchived) continue;
        allTransactions.push(transaction);
      }
    }

    return calculateBudget(allTransactions);
  },
});

export const getPaginatedTransactions = query({
  args: {
    projectIds: v.optional(v.array(v.id("projects"))),
    donorId: v.optional(v.id("donors")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { projectIds, donorId, startDate, endDate } = args;

    let dbQuery;
    if (projectIds?.length === 1) {
      dbQuery = ctx.db
        .query("transactions")
        .withIndex("by_organization_project", (q) =>
          q
            .eq("organizationId", user.organizationId)
            .eq("projectId", projectIds[0]),
        );
    } else if (donorId) {
      dbQuery = ctx.db
        .query("transactions")
        .withIndex("by_organization_donor", (q) =>
          q.eq("organizationId", user.organizationId).eq("donorId", donorId),
        );
    } else {
      dbQuery = ctx.db
        .query("transactions")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", user.organizationId),
        );
    }

    const result = await dbQuery.order("desc").paginate(args.paginationOpts);

    let page = result.page.filter((transaction) => !transaction.isArchived);

    if (projectIds && projectIds.length > 1) {
      const projectIdSet = new Set(projectIds);
      page = page.filter(
        (transaction) =>
          transaction.projectId && projectIdSet.has(transaction.projectId),
      );
    }

    if (startDate !== undefined && endDate !== undefined) {
      page = page.filter(
        (transaction) =>
          transaction.date >= startDate && transaction.date <= endDate,
      );
    }

    const filtered = donorId
      ? page
      : await filterByProjectAccess(ctx, user._id, user.organizationId, page);

    return {
      ...result,
      page: await addProjectAndCategoryNames(ctx, filtered),
    };
  },
});
