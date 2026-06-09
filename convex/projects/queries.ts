import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const getAllProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user?.organizationId) return [];

    return ctx.db
      .query("projects")
      .withIndex("by_organization_archived", (q) =>
        q.eq("organizationId", user.organizationId!).eq("isArchived", false),
      )
      .collect();
  },
});

export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await getCurrentUser(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== user.organizationId)
      throw new Error("No access");

    return project;
  },
});

export const getArchivedProjects = query({
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return ctx.db
      .query("projects")
      .withIndex("by_organization_archived", (q) =>
        q.eq("organizationId", user.organizationId).eq("isArchived", true),
      )
      .collect();
  },
});
