import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const getUserBankDetails = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return {
      iban: user.iban || "",
      bic: user.bic || "",
      accountHolder: user.accountHolder || user.name || "",
    };
  },
});

export const getReimbursement = query({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const reimbursement = await ctx.db.get(args.reimbursementId);
    if (!reimbursement || reimbursement.organizationId !== user.organizationId)
      return null;

    if (reimbursement.type !== "travel") return reimbursement;

    const travelDetails = await ctx.db
      .query("travelDetails")
      .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
      .first();

    return { ...reimbursement, travelDetails };
  },
});

export const getReceipts = query({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const reimbursement = await ctx.db.get(args.reimbursementId);
    if (!reimbursement || reimbursement.organizationId !== user.organizationId)
      return [];

    return ctx.db
      .query("receipts")
      .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
      .collect();
  },
});

export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return ctx.storage.getUrl(args.storageId);
  },
});

export const getAllReimbursements = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const isAdmin = user.role === "admin";

    const reimbursements = isAdmin
      ? await ctx.db
          .query("reimbursements")
          .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
          .order("desc")
          .collect()
      : await ctx.db
          .query("reimbursements")
          .withIndex("by_organization_and_createdBy", (q) =>
            q.eq("organizationId", user.organizationId).eq("createdBy", user._id),
          )
          .order("desc")
          .collect();

    const creatorIds = [...new Set(reimbursements.map((item) => item.createdBy))];
    const projectIds = [...new Set(reimbursements.map((item) => item.projectId))];
    const reviewerIds = [...new Set(reimbursements.map((item) => item.reviewedBy).filter(Boolean))];
    const travelIds = reimbursements.filter((item) => item.type === "travel").map((item) => item._id);

    const [creators, projects, reviewers, travelDetailsList] = await Promise.all([
      Promise.all(creatorIds.map((id) => ctx.db.get(id))),
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(reviewerIds.map((id) => ctx.db.get(id!))),
      Promise.all(
        travelIds.map((id) =>
          ctx.db
            .query("travelDetails")
            .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", id))
            .first(),
        ),
      ),
    ]);

    const creatorMap = new Map(creators.filter(Boolean).map((user) => [user!._id, user!.name]));
    const projectMap = new Map(projects.filter(Boolean).map((project) => [project!._id, project!.name]));
    const reviewerMap = new Map(reviewers.filter(Boolean).map((user) => [user!._id, user!.name]));
    const travelMap = new Map(travelDetailsList.filter(Boolean).map((travel) => [travel!.reimbursementId, travel!]));

    return reimbursements.map((item) => ({
      ...item,
      creatorName: creatorMap.get(item.createdBy) || "Unknown",
      projectName: projectMap.get(item.projectId) || "Unbekanntes Projekt",
      travelDetails: travelMap.get(item._id),
      reviewedByName: item.reviewedBy ? reviewerMap.get(item.reviewedBy) : undefined,
    }));
  },
});

export const getReimbursementWithDetails = internalQuery({
  args: { reimbursementId: v.id("reimbursements") },
  handler: async (ctx, args) => {
    const reimbursement = await ctx.db.get(args.reimbursementId);
    if (!reimbursement) return null;

    const [organization, creator, project, receipts] = await Promise.all([
      ctx.db.get(reimbursement.organizationId),
      ctx.db.get(reimbursement.createdBy),
      ctx.db.get(reimbursement.projectId),
      ctx.db
        .query("receipts")
        .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
        .collect(),
    ]);

    if (!organization || !creator || !project) return null;

    const travelDetails =
      reimbursement.type === "travel"
        ? await ctx.db
            .query("travelDetails")
            .withIndex("by_reimbursement", (q) => q.eq("reimbursementId", args.reimbursementId))
            .first()
        : null;

    return {
      ...reimbursement,
      organization,
      creator,
      project,
      receipts,
      travelDetails,
    };
  },
});
