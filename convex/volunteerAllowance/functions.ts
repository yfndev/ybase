import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { escapeHtml, resend } from "../invitations/functions";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "../users/getCurrentUser";
import { requireRole } from "../users/permissions";
import { MAX_VOLUNTEER_ALLOWANCE_EUR } from "./constants";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    amount: v.number(),
    iban: v.string(),
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    activityDescription: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    taxYear: v.optional(v.string()),
    volunteerName: v.string(),
    volunteerStreet: v.string(),
    volunteerPlz: v.string(),
    volunteerCity: v.string(),
    signatureStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) {
      throw new Error(`Volunteer allowance cannot exceed ${MAX_VOLUNTEER_ALLOWANCE_EUR}€`);
    }

    const id = await ctx.db.insert("volunteerAllowance", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: args.amount,
      isApproved: false,
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      createdBy: user._id,
      activityDescription: args.activityDescription,
      startDate: args.startDate,
      endDate: args.endDate,
      taxYear: args.taxYear,
      volunteerName: args.volunteerName,
      volunteerStreet: args.volunteerStreet,
      volunteerPlz: args.volunteerPlz,
      volunteerCity: args.volunteerCity,
      signatureStorageId: args.signatureStorageId,
    });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "volunteerAllowance.create",
      id,
      `${args.amount}€`,
    );
  },
});

export const createLink = mutation({
  args: {
    projectId: v.id("projects"),
    activityDescription: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const id = await ctx.db.insert("volunteerAllowance", {
      organizationId: user.organizationId,
      projectId: args.projectId,
      amount: 0,
      isApproved: false,
      iban: "",
      bic: "",
      accountHolder: "",
      createdBy: user._id,
      activityDescription: args.activityDescription || "",
      startDate: args.startDate || "",
      endDate: args.endDate || "",
      volunteerName: "",
      volunteerStreet: "",
      volunteerPlz: "",
      volunteerCity: "",
    });

    return id;
  },
});

export const generatePublicUploadUrl = mutation({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Invalid link");
    if (doc.volunteerName && doc.signatureStorageId)
      throw new Error("Already submitted");
    return ctx.storage.generateUploadUrl();
  },
});

export const submitExternal = mutation({
  args: {
    id: v.id("volunteerAllowance"),
    amount: v.number(),
    iban: v.string(),
    bic: v.optional(v.string()),
    accountHolder: v.string(),
    activityDescription: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    taxYear: v.optional(v.string()),
    volunteerName: v.string(),
    volunteerStreet: v.string(),
    volunteerPlz: v.string(),
    volunteerCity: v.string(),
    signatureStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Invalid link");
    if (doc.volunteerName && doc.signatureStorageId)
      throw new Error("Already submitted");
    if (args.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) throw new Error(`Amount cannot exceed ${MAX_VOLUNTEER_ALLOWANCE_EUR}€`);

    await ctx.db.patch(args.id, {
      amount: args.amount,
      iban: args.iban,
      bic: args.bic,
      accountHolder: args.accountHolder,
      activityDescription: args.activityDescription,
      startDate: args.startDate,
      endDate: args.endDate,
      taxYear: args.taxYear,
      volunteerName: args.volunteerName,
      volunteerStreet: args.volunteerStreet,
      volunteerPlz: args.volunteerPlz,
      volunteerCity: args.volunteerCity,
      signatureStorageId: args.signatureStorageId,
    });

    await addLog(
      ctx,
      doc.organizationId,
      doc.createdBy,
      "volunteerAllowance.create",
      args.id,
      `extern ${args.amount}€`,
    );
  },
});

export const approve = mutation({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== user.organizationId)
      throw new Error("Not found");

    if (doc.amount > MAX_VOLUNTEER_ALLOWANCE_EUR) {
      throw new Error(`Cannot approve: amount exceeds ${MAX_VOLUNTEER_ALLOWANCE_EUR}€ legal limit`);
    }

    await ctx.db.patch(args.id, { isApproved: true, reviewedBy: user._id });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "volunteerAllowance.approve",
      args.id,
      `${doc.amount}€`,
    );
  },
});

export const reject = mutation({
  args: { id: v.id("volunteerAllowance"), rejectionNote: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== user.organizationId)
      throw new Error("Not found");

    await ctx.db.patch(args.id, {
      isApproved: false,
      rejectionNote: args.rejectionNote,
      reviewedBy: user._id,
    });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "volunteerAllowance.reject",
      args.id,
      args.rejectionNote,
    );
  },
});

export const remove = mutation({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== user.organizationId)
      throw new Error("Not found");

    if (doc.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Only the creator or an admin can delete");
    }

    if (doc.signatureStorageId) {
      await ctx.storage.delete(doc.signatureStorageId);
    }

    await ctx.db.delete(args.id);

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "volunteerAllowance.delete",
      args.id,
      `${doc.amount}€`,
    );
  },
});

export const sendAllowanceLink = mutation({
  args: {
    email: v.string(),
    link: v.string(),
    projectName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const senderName = escapeHtml(user.firstName ?? "");
    const projectName = escapeHtml(args.projectName);

    await resend.sendEmail(ctx, {
      from: "YBudget <team@ybudget.de>",
      to: args.email,
      subject: "Ehrenamtspauschale ausfüllen",
      html: `
        <p>Hallo,</p>
        <p>${senderName} hat dir einen Link zum Ausfüllen der Ehrenamtspauschale für das Projekt "${projectName}" gesendet.</p>
        <p><a href="${args.link}">Hier klicken zum Ausfüllen</a></p>
        <p>Viele Grüße,<br/>Dein YBudget Team</p>
      `,
    });
  },
});
