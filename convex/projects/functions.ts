import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { requireRole } from "../users/permissions";

export const createProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      organizationId: user.organizationId,
      isArchived: false,
      createdBy: user._id,
    });

    await addLog(ctx, user.organizationId, user._id, "project.create", projectId, args.name);
    return projectId;
  },
});

export const renameProject = mutation({
  args: { projectId: v.id("projects"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const project = await ctx.db.get(args.projectId);

    if (!project) throw new Error("Project not found");
    if (project.organizationId !== user.organizationId) throw new Error("Access denied");

    await ctx.db.patch(args.projectId, { name: args.name });
    await addLog(ctx, user.organizationId, user._id, "project.rename", args.projectId, `${project.name} → ${args.name}`);
  },
});

export const archiveProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const project = await ctx.db.get(args.projectId);

    if (!project || project.organizationId !== user.organizationId) throw new Error("Access denied");

    await ctx.db.patch(args.projectId, { isArchived: true });
    await addLog(ctx, user.organizationId, user._id, "project.archive", args.projectId, project?.name);
  },
});

export const unarchiveProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const project = await ctx.db.get(args.projectId);

    if (!project) throw new Error("Project not found");
    if (project.organizationId !== user.organizationId) throw new Error("Access denied");

    await ctx.db.patch(args.projectId, { isArchived: false });
    await addLog(ctx, user.organizationId, user._id, "project.unarchive", args.projectId, project.name);
  },
});

export const checkProjectLinkedData = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== user.organizationId) throw new Error("Access denied");

    const [reimbursements, allowances] = await Promise.all([
      ctx.db
        .query("reimbursements")
        .withIndex("by_organization_project", (q) =>
          q.eq("organizationId", user.organizationId).eq("projectId", args.projectId),
        )
        .first(),
      ctx.db
        .query("volunteerAllowance")
        .withIndex("by_organization_project", (q) =>
          q.eq("organizationId", user.organizationId).eq("projectId", args.projectId),
        )
        .first(),
    ]);

    return { hasLinkedData: !!(reimbursements || allowances) };
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
    mergeIntoProjectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const project = await ctx.db.get(args.projectId);

    if (!project || project.organizationId !== user.organizationId) throw new Error("Access denied");

    const targetId = args.mergeIntoProjectId;

    if (targetId) {
      const target = await ctx.db.get(targetId);
      if (!target || target.organizationId !== user.organizationId) throw new Error("Zielprojekt nicht gefunden");
      if (targetId === args.projectId) throw new Error("Zielprojekt darf nicht das gleiche Projekt sein");

      const reimbursements = await ctx.db
        .query("reimbursements")
        .withIndex("by_organization_project", (q) =>
          q.eq("organizationId", user.organizationId).eq("projectId", args.projectId),
        )
        .collect();
      for (const r of reimbursements) {
        await ctx.db.patch(r._id, { projectId: targetId });
      }

      const allowances = await ctx.db
        .query("volunteerAllowance")
        .withIndex("by_organization_project", (q) =>
          q.eq("organizationId", user.organizationId).eq("projectId", args.projectId),
        )
        .collect();
      for (const a of allowances) {
        await ctx.db.patch(a._id, { projectId: targetId });
      }
    }

    await ctx.db.delete(args.projectId);
    await addLog(ctx, user.organizationId, user._id, "project.delete", args.projectId, project.name);
  },
});
