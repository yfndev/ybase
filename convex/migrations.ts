import { internalMutation } from "./_generated/server";

/**
 * Wipes all reimbursements and receipts.
 * Run once via Convex dashboard, then remove this file.
 */
export const wipeReimbursements = internalMutation({
  handler: async (ctx) => {
    const reimbursements = await ctx.db.query("reimbursements").collect();
    for (const doc of reimbursements) await ctx.db.delete(doc._id);

    const receipts = await ctx.db.query("receipts").collect();
    for (const doc of receipts) await ctx.db.delete(doc._id);

    const travelDetails = await ctx.db.query("travelDetails").collect();
    for (const doc of travelDetails) await ctx.db.delete(doc._id);

    return { reimbursements: reimbursements.length, receipts: receipts.length, travelDetails: travelDetails.length };
  },
});

/**
 * Wipes all transactions.
 * Run once via Convex dashboard, then remove this file.
 */
export const wipeTransactions = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("transactions").collect();
    for (const doc of docs) await ctx.db.delete(doc._id);
    return { deleted: docs.length };
  },
});

/**
 * Migrates volunteerAllowance: sets status from isApproved, removes legacy fields.
 * Run once via Convex dashboard, then remove this file.
 */
export const migrateVolunteerAllowanceStatus = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("volunteerAllowance").collect();
    let migrated = 0;

    for (const doc of docs) {
      const legacy = doc as any;
      const needsMigration =
        doc.status === undefined ||
        legacy.isApproved !== undefined ||
        legacy.token !== undefined ||
        legacy.expiresAt !== undefined ||
        legacy.usedAt !== undefined;

      if (!needsMigration) continue;

      const status = doc.status ?? (legacy.isApproved === true ? "approved" : "pending");
      await ctx.db.patch(doc._id, {
        status,
        isApproved: undefined,
        token: undefined,
        expiresAt: undefined,
        usedAt: undefined,
      });
      migrated++;
    }

    return { migrated, total: docs.length };
  },
});
