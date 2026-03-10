import { internalMutation } from "./_generated/server";

/**
 * One-time migration: converts reimbursements from isApproved (bool)
 * to status ("pending" | "approved" | "declined").
 *
 * Run once via Convex dashboard after deploying phase 1 schema changes,
 * then remove this file and the schema TODO comment.
 */
export const migrateReimbursementStatus = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("reimbursements").collect();
    let migrated = 0;

    for (const doc of docs) {
      if (doc.status !== undefined) continue;

      const status = doc.isApproved === true ? "approved" : "pending";
      await ctx.db.patch(doc._id, { status, isApproved: undefined });
      migrated++;
    }

    return { migrated, total: docs.length };
  },
});
