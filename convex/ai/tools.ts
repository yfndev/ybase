import { createTool, type ToolCtx } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

type Ctx = ToolCtx & {
  userId: Id<"users">;
  organizationId: Id<"organizations">;
};

export const getOpenItems = createTool({
  description:
    "Get all open items (expected income and expenses that haven't been processed yet)",
  args: z.object({}),
  handler: async (
    ctx: Ctx,
  ): Promise<
    Array<{
      date: string;
      amount: number;
      description: string;
      counterparty: string;
      project: string | undefined;
      type: string;
    }>
  > => {
    const transactions = await ctx.runQuery(
      internal.ai.internalQueries.getTransactions,
      {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      },
    );

    const openItems = transactions
      .filter((transaction) => transaction.status === "expected")
      .sort((first, second) => first.date - second.date);

    return openItems.map((transaction) => ({
      date: new Date(transaction.date).toLocaleDateString("de-DE"),
      amount: transaction.amount,
      description: transaction.description,
      counterparty: transaction.counterparty,
      project: transaction.projectName,
      type: transaction.amount > 0 ? "Einnahme" : "Ausgabe",
    }));
  },
});

export const getOpenReimbursements = createTool({
  description: "Get all open reimbursements (not yet approved)",
  args: z.object({}),
  handler: async (
    ctx: Ctx,
  ): Promise<
    Array<{
      date: string;
      amount: number;
      project: string;
      creator: string;
      category: string;
    }>
  > => {
    const reimbursements = await ctx.runQuery(
      internal.ai.internalQueries.getReimbursements,
      {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      },
    );

    const openReimbursements = reimbursements.filter(
      (reimbursement) => reimbursement.status === "pending",
    );

    return openReimbursements.map((reimbursement) => ({
      date: new Date(reimbursement._creationTime).toLocaleDateString("de-DE"),
      amount: reimbursement.amount,
      project: reimbursement.projectName,
      creator: reimbursement.creatorName,
      category: reimbursement.category,
    }));
  },
});

export const getRecentTransactions = createTool({
  description:
    "Get recent transactions, optionally filtered by type. Returns max 20.",
  args: z.object({
    limit: z.number().optional().describe("Number of transactions (max 20)"),
    type: z
      .enum(["all", "expenses", "income"])
      .optional()
      .describe("Filter by type"),
    sortBy: z
      .enum(["date", "amount"])
      .optional()
      .describe("Sort by date or amount"),
  }),
  handler: async (
    ctx: Ctx,
    args,
  ): Promise<
    Array<{
      date: string;
      amount: number;
      description: string;
      counterparty: string;
      project: string | undefined;
    }>
  > => {
    const all = await ctx.runQuery(
      internal.ai.internalQueries.getTransactions,
      {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
      },
    );

    let filtered = all.filter(
      (transaction) => transaction.status === "processed",
    );

    if (args.type === "expenses") {
      filtered = filtered.filter((transaction) => transaction.amount < 0);
    } else if (args.type === "income") {
      filtered = filtered.filter((transaction) => transaction.amount > 0);
    }

    if (args.sortBy === "amount") {
      filtered.sort(
        (first, second) => Math.abs(second.amount) - Math.abs(first.amount),
      );
    } else {
      filtered.sort((first, second) => second.date - first.date);
    }

    const limit = Math.min(args.limit ?? 10, 20);

    return filtered.slice(0, limit).map((transaction) => ({
      date: new Date(transaction.date).toLocaleDateString("de-DE"),
      amount: transaction.amount,
      description: transaction.description,
      counterparty: transaction.counterparty,
      project: transaction.projectName,
    }));
  },
});
