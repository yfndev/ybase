import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const getAllDonors = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return ctx.db
      .query("donors")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .collect();
  },
});

export const getDonorsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_organization_project_donor", (q) =>
        q
          .eq("organizationId", user.organizationId)
          .eq("projectId", args.projectId),
      )
      .collect();

    const donorIds = transactions.map((transaction) => transaction.donorId);
    const uniqueDonorIds = [...new Set(donorIds.filter(Boolean))];

    const donors = await Promise.all(
      uniqueDonorIds.map((donorId) => ctx.db.get(donorId!)),
    );
    return donors.filter(Boolean);
  },
});

export const getDonorById = query({
  args: { donorId: v.id("donors") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const donor = await ctx.db.get(args.donorId);
    if (!donor) throw new Error("Donor not found");
    if (donor.organizationId !== user.organizationId)
      throw new Error("Unauthorized");

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_organization_donor", (q) =>
        q.eq("organizationId", user.organizationId).eq("donorId", args.donorId),
      )
      .collect();

    const transactions = allTransactions.filter((t) => !t.isArchived);

    let expectedIncome = 0;
    let paidIncome = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      if (transaction.amount > 0) {
        if (transaction.status === "expected")
          expectedIncome += transaction.amount;
        if (transaction.status === "processed")
          paidIncome += transaction.amount;
      } else {
        expenses += Math.abs(transaction.amount);
      }
    }

    const round = (v: number) => Math.round(v * 100) / 100;
    return {
      ...donor,
      committedIncome: round(expectedIncome + paidIncome),
      paidIncome: round(paidIncome),
      availableBudget: round(paidIncome - expenses),
    };
  },
});

export const getDonorTransactions = query({
  args: { donorId: v.id("donors") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    return ctx.db
      .query("transactions")
      .withIndex("by_organization_donor", (q) =>
        q.eq("organizationId", user.organizationId).eq("donorId", args.donorId),
      )
      .collect();
  },
});
