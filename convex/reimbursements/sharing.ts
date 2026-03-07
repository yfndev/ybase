import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { escapeHtml, resend } from "../invitations/functions";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "../users/getCurrentUser";
import { receiptValidator, travelReceiptValidator } from "./validators";

export const createReimbursementLink = mutation({
  args: {
    projectId: v.id("projects"),
    type: v.union(v.literal("expense"), v.literal("travel")),
    description: v.optional(v.string()),
    travelDetails: v.optional(
      v.object({
        destination: v.optional(v.string()),
        purpose: v.optional(v.string()),
        startDate: v.optional(v.string()),
        endDate: v.optional(v.string()),
        allowFoodAllowance: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const reimbursementId = await ctx.db.insert("reimbursements", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: 0,
      type: args.type,
      status: "pending",
      iban: "",
      bic: "",
      accountHolder: "",
      createdBy: user._id,
      isSharedLink: true,
      description: args.description || "",
    });

    if (args.type === "travel" && args.travelDetails) {
      await ctx.db.insert("travelDetails", {
        reimbursementId,
        startDate: args.travelDetails.startDate || "",
        endDate: args.travelDetails.endDate || "",
        destination: args.travelDetails.destination || "",
        purpose: args.travelDetails.purpose || "",
        isInternational: false,
        allowFoodAllowance: args.travelDetails.allowFoodAllowance || false,
      });
    }

    return reimbursementId;
  },
});

export const generatePublicUploadUrl = mutation({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.reimbursementId);

    if (!doc) throw new Error("Invalid link");
    if (!doc.isSharedLink) throw new Error("Not a shared link");
    if (doc.submitterName) throw new Error("Already submitted");

    return ctx.storage.generateUploadUrl();
  },
});

export const submitExternalReimbursement = mutation({
  args: {
    reimbursementId: v.id("reimbursements"),
    amount: v.number(),
    iban: v.string(),
    bic: v.string(),
    accountHolder: v.string(),
    submitterName: v.string(),
    submitterEmail: v.optional(v.string()),
    signatureStorageId: v.id("_storage"),
    receipts: v.array(receiptValidator),
    travelReceipts: v.optional(v.array(travelReceiptValidator)),
    travelDetails: v.optional(
      v.object({
        startDate: v.string(),
        endDate: v.string(),
        destination: v.string(),
        purpose: v.string(),
        isInternational: v.boolean(),
        mealAllowanceDays: v.optional(v.number()),
        mealAllowanceDailyBudget: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.reimbursementId);

    if (!doc) throw new Error("Invalid link");
    if (!doc.isSharedLink) throw new Error("Not a shared link");
    if (doc.submitterName) throw new Error("Already submitted");

    await ctx.db.patch(args.reimbursementId, {
      amount: args.amount,
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      submitterName: args.submitterName,
      submitterEmail: args.submitterEmail,
      signatureStorageId: args.signatureStorageId,
    });

    const receiptsToInsert = doc.type === "travel" ? args.travelReceipts || [] : args.receipts;
    for (const receipt of receiptsToInsert) {
      await ctx.db.insert("receipts", {
        reimbursementId: args.reimbursementId,
        ...receipt,
      });
    }

    if (doc.type === "travel" && args.travelDetails) {
      const existingTravel = await ctx.db
        .query("travelDetails")
        .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
        .first();

      if (existingTravel) {
        await ctx.db.patch(existingTravel._id, args.travelDetails);
      } else {
        await ctx.db.insert("travelDetails", {
          reimbursementId: args.reimbursementId,
          ...args.travelDetails,
        });
      }
    }

    await addLog(
      ctx,
      doc.organizationId,
      doc.createdBy,
      "reimbursement.externalSubmit",
      args.reimbursementId,
      `extern ${args.amount}€`,
    );
  },
});

export const sendReimbursementLink = mutation({
  args: {
    email: v.string(),
    link: v.string(),
    projectName: v.string(),
    type: v.union(v.literal("expense"), v.literal("travel")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const typeLabel = args.type === "expense" ? "Auslagenerstattung" : "Reisekostenerstattung";

    const senderName = escapeHtml(user.firstName ?? "");
    const projectName = escapeHtml(args.projectName);

    await resend.sendEmail(ctx, {
      from: "YBudget <team@ybudget.de>",
      to: args.email,
      subject: `${typeLabel} ausfüllen`,
      html: `
        <p>Hallo,</p>
        <p>${senderName} hat dir einen Link zum Ausfüllen der ${typeLabel} für das Projekt "${projectName}" gesendet.</p>
        <p><a href="${args.link}">Hier klicken zum Ausfüllen</a></p>
        <p>Viele Grüße,<br/>Dein YBudget Team</p>
      `,
    });
  },
});

export const deleteSharedReimbursementLink = mutation({
  args: { id: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const doc = await ctx.db.get(args.id);

    if (!doc) throw new Error("Not found");
    if (!doc.isSharedLink) throw new Error("Not a shared link");
    if (doc.amount > 0) throw new Error("Cannot delete submitted reimbursement");
    if (doc.organizationId !== user.organizationId) throw new Error("Unauthorized");

    if (doc.type === "travel") {
      const travelDetails = await ctx.db
        .query("travelDetails")
        .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.id))
        .first();

      if (travelDetails) {
        await ctx.db.delete(travelDetails._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const validateReimbursementLink = query({
  args: { id: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);

    if (!doc) return { valid: false, error: "Link ungültig" } as const;
    if (!doc.isSharedLink) return { valid: false, error: "Kein geteilter Link" } as const;
    if (doc.amount > 0) return { valid: false, error: "Bereits eingereicht" } as const;

    const [organization, project] = await Promise.all([
      ctx.db.get(doc.organizationId),
      ctx.db.get(doc.projectId),
    ]);

    let travelDetails = null;
    if (doc.type === "travel") {
      travelDetails = await ctx.db
        .query("travelDetails")
        .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.id))
        .first();
    }

    return {
      valid: true,
      type: doc.type,
      organizationName: organization?.name || "",
      projectName: project?.name || "",
      description: doc.description,
      travelDetails,
    } as const;
  },
});

export const getPendingSharedLinks = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    const allReimbursements = await ctx.db
      .query("reimbursements")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const pendingReimbursements = allReimbursements.filter(
      (reimbursement) => reimbursement.isSharedLink && reimbursement.amount === 0,
    );

    const allAllowances = await ctx.db
      .query("volunteerAllowance")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const pendingAllowances = allAllowances.filter(
      (allowance) => !allowance.signatureStorageId && !allowance.volunteerName,
    );

    const projectIds = [
      ...new Set([
        ...pendingReimbursements.map((reimbursement) => reimbursement.projectId),
        ...pendingAllowances.map((allowance) => allowance.projectId),
      ]),
    ];
    const projects = await Promise.all(projectIds.map((id) => ctx.db.get(id)));
    const projectMap = new Map(
      projects.filter(Boolean).map((project) => [project!._id, project!.name]),
    );

    const creatorIds = [
      ...new Set([
        ...pendingReimbursements.map((reimbursement) => reimbursement.createdBy),
        ...pendingAllowances.map((allowance) => allowance.createdBy),
      ]),
    ];
    const creators = await Promise.all(creatorIds.map((id) => ctx.db.get(id)));
    const creatorMap = new Map(
      creators.filter(Boolean).map((creator) => [creator!._id, creator!.name]),
    );

    return {
      reimbursementLinks: pendingReimbursements.map((reimbursement) => ({
        _id: reimbursement._id,
        _creationTime: reimbursement._creationTime,
        type: reimbursement.type,
        projectName: projectMap.get(reimbursement.projectId) || "Unknown",
        description: reimbursement.description,
        creatorName: creatorMap.get(reimbursement.createdBy) || "Unknown",
        linkType: "reimbursement" as const,
      })),
      allowanceLinks: pendingAllowances.map((allowance) => ({
        _id: allowance._id,
        _creationTime: allowance._creationTime,
        projectName: projectMap.get(allowance.projectId) || "Unknown",
        activityDescription: allowance.activityDescription,
        creatorName: creatorMap.get(allowance.createdBy) || "Unknown",
        linkType: "allowance" as const,
      })),
    };
  },
});

export const deleteSharedAllowanceLink = mutation({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const doc = await ctx.db.get(args.id);

    if (!doc) throw new Error("Not found");
    if (doc.signatureStorageId || doc.volunteerName) throw new Error("Cannot delete submitted allowance");
    if (doc.organizationId !== user.organizationId) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
