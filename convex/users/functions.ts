import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "./getCurrentUser";
import { requireRole } from "./permissions";

export const addUserToOrganization = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("lead"), v.literal("member")),
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "admin");

    if (args.organizationId !== currentUser.organizationId) {
      throw new Error("Cannot add users to other organizations");
    }

    await ctx.db.patch(args.userId, {
      organizationId: args.organizationId,
      role: args.role ?? "lead",
    });
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("lead"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireRole(ctx, "admin");
    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser) throw new Error("User not found");
    if (targetUser.organizationId !== currentUser.organizationId)
      throw new Error("Access denied");

    if (targetUser.role === "admin" && args.role !== "admin") {
      const admins = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", currentUser.organizationId),
        )
        .filter((q) => q.eq(q.field("role"), "admin"))
        .take(2);
      if (admins.length <= 1)
        throw new Error(
          "Der letzte Admin kann nicht entfernt werden. Mindestens ein Admin ist erforderlich.",
        );
    }

    const oldRole = targetUser.role ?? "member";
    await ctx.db.patch(args.userId, { role: args.role });
    await addLog(
      ctx,
      currentUser.organizationId,
      currentUser._id,
      "user.role_change",
      args.userId,
      `${targetUser.name ?? targetUser.email}: ${oldRole} → ${args.role}`,
    );
  },
});

export const updateBankDetails = mutation({
  args: {
    iban: v.string(),
    bic: v.string(),
    accountHolder: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await ctx.db.patch(user._id, args);
  },
});
