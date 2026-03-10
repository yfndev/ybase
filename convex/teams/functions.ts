import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { requireRole } from "../users/permissions";

export const createTeam = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      organizationId: user.organizationId,
      memberIds: [],
      projectIds: [],
      createdBy: user._id,
    });

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "team.create",
      teamId,
      args.name,
    );
    return teamId;
  },
});

export const renameTeam = mutation({
  args: { teamId: v.id("teams"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const team = await ctx.db.get(args.teamId);

    if (!team) throw new Error("Team not found");
    if (team.organizationId !== user.organizationId)
      throw new Error("Access denied");

    await ctx.db.patch(args.teamId, { name: args.name });
    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "team.update",
      args.teamId,
      `${team.name} → ${args.name}`,
    );
  },
});

export const addTeamMember = mutation({
  args: { teamId: v.id("teams"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.organizationId !== user.organizationId)
      throw new Error("Team not found");
    if (team.memberIds.includes(args.userId)) return;

    await ctx.db.patch(args.teamId, {
      memberIds: [...team.memberIds, args.userId],
    });
  },
});

export const removeTeamMember = mutation({
  args: { teamId: v.id("teams"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.organizationId !== user.organizationId)
      throw new Error("Team not found");

    await ctx.db.patch(args.teamId, {
      memberIds: team.memberIds.filter((memberId) => memberId !== args.userId),
    });
  },
});

export const assignProjectToTeam = mutation({
  args: { teamId: v.id("teams"), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.organizationId !== user.organizationId)
      throw new Error("Team not found");
    if (team.projectIds.includes(args.projectId)) return;

    await ctx.db.patch(args.teamId, {
      projectIds: [...team.projectIds, args.projectId],
    });
  },
});

export const removeProjectFromTeam = mutation({
  args: { teamId: v.id("teams"), projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, "admin");
    const team = await ctx.db.get(args.teamId);
    if (!team || team.organizationId !== user.organizationId)
      throw new Error("Team not found");

    await ctx.db.patch(args.teamId, {
      projectIds: team.projectIds.filter(
        (projectId) => projectId !== args.projectId,
      ),
    });
  },
});
