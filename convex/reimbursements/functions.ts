import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "../users/getCurrentUser";
import { requireRole } from "../users/permissions";
import { receiptValidator, travelReceiptValidator } from "./validators";

export { sendApprovalEmail, sendRejectionEmail } from "./sendApprovalEmail";

export const createReimbursement = mutation({
  args: {
    amount: v.number(),
    projectId: v.id("projects"),
    iban: v.string(),
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    currency: v.optional(v.string()),
    signatureStorageId: v.id("_storage"),
    receipts: v.array(receiptValidator),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const reimbursementId = await ctx.db.insert("reimbursements", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: args.amount,
      type: "expense",
      status: "pending",
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      currency: args.currency,
      signatureStorageId: args.signatureStorageId,
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
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    currency: v.optional(v.string()),
    signatureStorageId: v.id("_storage"),
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
      status: "pending",
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      currency: args.currency,
      signatureStorageId: args.signatureStorageId,
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

    if (reimbursement.signatureStorageId) {
      const signatureExists = await ctx.storage.getUrl(reimbursement.signatureStorageId);
      if (signatureExists) {
        await ctx.storage.delete(reimbursement.signatureStorageId);
      }
    }

    await ctx.db.delete(args.reimbursementId);
    await addLog(ctx, user.organizationId, user._id, "reimbursement.delete", args.reimbursementId, `${reimbursement.amount}€`);
  },
});

export const approve = mutation({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const reimbursement = await ctx.db.get(args.reimbursementId);

    if (!reimbursement || reimbursement.organizationId !== user.organizationId) {
      throw new Error("Reimbursement not found");
    }

    if (reimbursement.status !== "pending") {
      throw new Error("Reimbursement already processed");
    }

    await ctx.db.patch(args.reimbursementId, { status: "approved", reviewedBy: user._id, reviewedAt: Date.now() });
    await addLog(ctx, user.organizationId, user._id, "reimbursement.approve", args.reimbursementId, `${reimbursement.amount}€`);

    await ctx.scheduler.runAfter(0, internal.reimbursements.functions.sendApprovalEmail, {
      reimbursementId: args.reimbursementId,
    });
  },
});

export const decline = mutation({
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

    if (reimbursement.status !== "pending") {
      throw new Error("Reimbursement already processed");
    }

    await ctx.db.patch(args.reimbursementId, {
      status: "declined",
      rejectionNote: args.rejectionNote,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
    });

    await addLog(ctx, user.organizationId, user._id, "reimbursement.decline", args.reimbursementId, args.rejectionNote);

    await ctx.scheduler.runAfter(0, internal.reimbursements.functions.sendRejectionEmail, {
      reimbursementId: args.reimbursementId,
    });
  },
});
