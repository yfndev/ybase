import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { requireRole } from "../users/permissions";

async function getProjectName(
  ctx: MutationCtx,
  projectId: Id<"projects"> | null | undefined,
) {
  if (!projectId) return "Root";
  const project = await ctx.db.get(projectId);
  return project?.name ?? "Root";
}

export const createProject = mutation({
  args: {
    name: v.string(),
    parentId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId);
      if (parent?.parentId) {
        throw new Error("Projects can only be nested one level deep");
      }
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      organizationId: user.organizationId,
      parentId: args.parentId,
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

    const isReserves = project.name === "Rücklagen" && !project.parentId;
    if (isReserves) throw new Error("Rücklagen kann nicht archiviert werden");

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

export const moveProject = mutation({
  args: {
    projectId: v.id("projects"),
    newParentId: v.union(v.id("projects"), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "lead");
    const project = await ctx.db.get(args.projectId);

    if (!project) throw new Error("Project not found");
    if (project.organizationId !== user.organizationId) throw new Error("Access denied");

    if (args.newParentId) {
      const newParent = await ctx.db.get(args.newParentId);
      if (!newParent) throw new Error("Parent not found");
      if (newParent.parentId) throw new Error("Cannot move to a nested project");
      if (args.newParentId === args.projectId) throw new Error("Cannot move project to itself");
      if (newParent.name === "Rücklagen") throw new Error("Cannot move to Rücklagen");
    }

    const children = await ctx.db
      .query("projects")
      .withIndex("by_organization_parentId", (q) => q.eq("organizationId", user.organizationId).eq("parentId", args.projectId))
      .collect();

    if (children.length > 0 && args.newParentId) {
      throw new Error("Cannot move a department with children");
    }

    const oldParentName = await getProjectName(ctx, project.parentId);
    const newParentName = await getProjectName(ctx, args.newParentId);

    await ctx.db.patch(args.projectId, { parentId: args.newParentId ?? undefined });
    await addLog(ctx, user.organizationId, user._id, "project.move", args.projectId, `${project.name}: ${oldParentName} → ${newParentName}`);
  },
});
