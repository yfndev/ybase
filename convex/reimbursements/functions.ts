import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "../users/getCurrentUser";
import { requireRole } from "../users/permissions";

export { sendApprovalEmail } from "./sendApprovalEmail";

const receiptValidator = v.object({
  receiptNumber: v.string(),
  receiptDate: v.string(),
  companyName: v.string(),
  description: v.string(),
  netAmount: v.number(),
  taxRate: v.number(),
  grossAmount: v.number(),
  fileStorageId: v.id("_storage"),
});

const travelReceiptValidator = v.object({
  receiptNumber: v.string(),
  receiptDate: v.string(),
  companyName: v.string(),
  description: v.string(),
  netAmount: v.number(),
  taxRate: v.number(),
  grossAmount: v.number(),
  fileStorageId: v.id("_storage"),
  costType: v.union(
    v.literal("car"),
    v.literal("train"),
    v.literal("flight"),
    v.literal("taxi"),
    v.literal("bus"),
    v.literal("accommodation"),
  ),
  kilometers: v.optional(v.number()),
});

export const createReimbursement = mutation({
  args: {
    amount: v.number(),
    projectId: v.id("projects"),
    iban: v.string(),
    bic: v.string(),
    accountHolder: v.string(),
    receipts: v.array(receiptValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const reimbursementId = await ctx.db.insert("reimbursements", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: args.amount,
      type: "expense",
      isApproved: false,
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      createdBy: user._id,
    });

    for (const receipt of args.receipts) {
      await ctx.db.insert("receipts", { reimbursementId, ...receipt });
    }

    await addLog(ctx, user.organizationId, user._id, "reimbursement.create", reimbursementId, `${args.amount}€`);

    return reimbursementId;
  },
});

export const createTravelReimbursement = mutation({
  args: {
    amount: v.number(),
    projectId: v.id("projects"),
    iban: v.string(),
    bic: v.string(),
    accountHolder: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    destination: v.string(),
    purpose: v.string(),
    isInternational: v.boolean(),
    mealAllowanceDays: v.optional(v.number()),
    mealAllowanceDailyBudget: v.optional(v.number()),
    receipts: v.array(travelReceiptValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const reimbursementId = await ctx.db.insert("reimbursements", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: args.amount,
      type: "travel",
      isApproved: false,
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      createdBy: user._id,
    });

    await ctx.db.insert("travelDetails", {
      reimbursementId,
      startDate: args.startDate,
      endDate: args.endDate,
      destination: args.destination,
      purpose: args.purpose,
      isInternational: args.isInternational,
      mealAllowanceDays: args.mealAllowanceDays,
      mealAllowanceDailyBudget: args.mealAllowanceDailyBudget,
    });

    for (const receipt of args.receipts) {
      await ctx.db.insert("receipts", { reimbursementId, ...receipt });
    }

    await addLog(ctx, user.organizationId, user._id, "reimbursement.create", reimbursementId, `Travel ${args.amount}€`);

    return reimbursementId;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

export const deleteReimbursement = mutation({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const reimbursement = await ctx.db.get(args.reimbursementId);

    if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
      throw new Error("Reimbursement not found");
    }

    if (reimbursement.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Only the creator or an admin can delete reimbursements");
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
      .collect();

    for (const receipt of receipts) {
      await ctx.storage.delete(receipt.fileStorageId);
      await ctx.db.delete(receipt._id);
    }

    if (reimbursement.type === "travel") {
      const travelDetails = await ctx.db
        .query("travelDetails")
        .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
        .first();

      if (travelDetails) {
        await ctx.db.delete(travelDetails._id);
      }
    }

    await ctx.db.delete(args.reimbursementId);
    await addLog(ctx, user.organizationId, user._id, "reimbursement.delete", args.reimbursementId, `${reimbursement.amount}€`);
  },
});

export const markAsPaid = mutation({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const reimbursement = await ctx.db.get(args.reimbursementId);

    if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
      throw new Error("Reimbursement not found");
    }

    const category = await ctx.db
      .query("categories")
      .withIndex("by_name", (q) => q.eq("name", "Auslagenerstattung"))
      .first();

    const project = await ctx.db.get(reimbursement.projectId);
    const description = project ? `${project.name} - Auslagenerstattung` : "Auslagenerstattung";

    await ctx.db.insert("transactions", {
      organizationId: reimbursement.organizationId,
      projectId: reimbursement.projectId,
      date: Date.now(),
      amount: -reimbursement.amount,
      description,
      counterparty: reimbursement.accountHolder,
      categoryId: category?._id,
      status: "expected",
      importedBy: user._id,
    });

    await ctx.db.patch(args.reimbursementId, { isApproved: true, reviewedBy: user._id });
    await addLog(ctx, user.organizationId, user._id, "reimbursement.pay", args.reimbursementId, `${reimbursement.amount}€`);

    await ctx.scheduler.runAfter(0, internal.reimbursements.functions.sendApprovalEmail, {
      reimbursementId: args.reimbursementId,
    });
  },
});

export const rejectReimbursement = mutation({
  args: {
    reimbursementId: v.id("reimbursements"),
    rejectionNote: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const reimbursement = await ctx.db.get(args.reimbursementId);

    if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
      throw new Error("Reimbursement not found");
    }

    await ctx.db.patch(args.reimbursementId, {
      isApproved: false,
      rejectionNote: args.rejectionNote,
      reviewedBy: user._id,
    });

    await addLog(ctx, user.organizationId, user._id, "reimbursement.reject", args.reimbursementId, args.rejectionNote);
  },
});
