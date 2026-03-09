import { query } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";
import { requireRole } from "../users/permissions";

export const getLogs = query({
  handler: async (ctx) => {
    await requireRole(ctx, "admin");
    const user = await getCurrentUser(ctx);

    return ctx.db
      .query("logs")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId),
      )
      .order("desc")
      .take(500);
  },
});
