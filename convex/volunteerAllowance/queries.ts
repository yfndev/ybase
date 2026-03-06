import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const validateLink = query({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);

    if (!doc) return { valid: false, error: "Invalid link" } as const;
    if (doc.volunteerName && doc.signatureStorageId) return { valid: false, error: "Already submitted" } as const;

    const [organization, project] = await Promise.all([
      ctx.db.get(doc.organizationId),
      ctx.db.get(doc.projectId),
    ]);

    return {
      valid: true,
      organizationName: organization?.name || "",
      projectName: project?.name || "",
      activityDescription: doc.activityDescription,
      startDate: doc.startDate,
      endDate: doc.endDate,
    } as const;
  },
});

export const getAll = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const isAdmin = user.role === "admin";

    const items = isAdmin
      ? await ctx.db
          .query("volunteerAllowance")
          .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
          .order("desc")
          .collect()
      : await ctx.db
          .query("volunteerAllowance")
          .withIndex("by_organization_and_createdBy", (q) =>
            q.eq("organizationId", user.organizationId).eq("createdBy", user._id),
          )
          .order("desc")
          .collect();

    const completed = items.filter((item) => item.signatureStorageId);

    const creatorIds = [...new Set(completed.map((item) => item.createdBy))];
    const projectIds = [...new Set(completed.map((item) => item.projectId))];
    const reviewerIds = [...new Set(completed.map((item) => item.reviewedBy).filter(Boolean))];

    const [organization, creators, projects, reviewers] = await Promise.all([
      ctx.db.get(user.organizationId),
      Promise.all(creatorIds.map((id) => ctx.db.get(id))),
      Promise.all(projectIds.map((id) => ctx.db.get(id))),
      Promise.all(reviewerIds.map((id) => ctx.db.get(id!))),
    ]);

    const creatorMap = new Map(creators.filter(Boolean).map((creator) => [creator!._id, creator!.name]));
    const projectMap = new Map(projects.filter(Boolean).map((project) => [project!._id, project!.name]));
    const reviewerMap = new Map(reviewers.filter(Boolean).map((reviewer) => [reviewer!._id, reviewer!.name]));

    return completed.map((item) => ({
      ...item,
      creatorName: creatorMap.get(item.createdBy) || "Unknown",
      projectName: projectMap.get(item.projectId) || "Unknown",
      organizationName: organization?.name || "",
      organizationStreet: organization?.street || "",
      organizationPlz: organization?.plz || "",
      organizationCity: organization?.city || "",
      reviewedByName: item.reviewedBy ? reviewerMap.get(item.reviewedBy) : undefined,
    }));
  },
});

export const get = query({
  args: { id: v.id("volunteerAllowance") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.organizationId !== user.organizationId) return null;
    return doc;
  },
});

export const getSignatureUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return ctx.storage.getUrl(args.storageId);
  },
});

// Signature token queries moved to convex/signatures/queries.ts
