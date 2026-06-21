import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const getOrganizationByDomain = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { exists: false };

    const user = await ctx.db.get(userId);
    if (!user?.email) return { exists: false };

    const domain = user.email.split("@")[1];
    if (!domain) return { exists: false };

    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first();

    if (!organization) return { exists: false };

    return { exists: true, organizationName: organization.name };
  },
});

export const getOrganization = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const org = await ctx.db.get(user.organizationId);
    if (!org) throw new Error("Organization not found");

    return {
      name: org.name,
      street: org.street || "",
      plz: org.plz || "",
      city: org.city || "",
      accountingEmail: org.accountingEmail || "",
      careOf: org.careOf || "",
      taxId: org.taxId || "",
    };
  },
});
