import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { addLog } from "../logs/functions";
import { getCurrentUser } from "../users/getCurrentUser";
import { requireRole } from "../users/permissions";

export const initializeOrganization = mutation({
  args: {
    organizationName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized user");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.organizationId) {
      return { organizationId: user.organizationId, isNew: false };
    }

    const domain = user.email?.split("@")[1]?.toLowerCase();
    if (!domain) throw new Error("Could not find a domain for this E-Mail");

    const existingOrg = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first();

    if (existingOrg) {
      await ctx.db.patch(user._id, {
        organizationId: existingOrg._id,
        role: "member",
      });
      return { organizationId: existingOrg._id, isNew: false };
    }

    const organizationId = await ctx.db.insert("organizations", {
      name: args.organizationName ?? `${domain} Organization`,
      domain,
      createdBy: user._id,
    });

    await ctx.db.insert("projects", {
      name: "Rücklagen",
      organizationId,
      isArchived: false,
      createdBy: user._id,
    });

    await ctx.db.patch(user._id, { organizationId, role: "admin" });

    return { organizationId, isNew: true };
  },
});

export const updateOrganization = mutation({
  args: {
    name: v.optional(v.string()),
    street: v.optional(v.string()),
    plz: v.optional(v.string()),
    city: v.optional(v.string()),
    accountingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin");
    const user = await getCurrentUser(ctx);

    const org = await ctx.db.get(user.organizationId);
    if (!org) throw new Error("Organization not found");

    const updates: Partial<typeof args> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.street !== undefined) updates.street = args.street;
    if (args.plz !== undefined) updates.plz = args.plz;
    if (args.city !== undefined) updates.city = args.city;
    if (args.accountingEmail !== undefined)
      updates.accountingEmail = args.accountingEmail;

    await ctx.db.patch(user.organizationId, updates);

    await addLog(
      ctx,
      user.organizationId,
      user._id,
      "organization.update",
      user.organizationId,
      Object.keys(updates).join(", "),
    );
  },
});
