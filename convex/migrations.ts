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

/**
 * One-time migration: converts volunteerAllowance from isApproved (bool) to
 * status ("pending" | "approved" | "declined"), and removes legacy token/expiresAt fields.
 *
 * Run once via Convex dashboard after deploying, then remove this file.
 */
export const migrateVolunteerAllowanceStatus = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("volunteerAllowance").collect();
    let migrated = 0;

    for (const doc of docs) {
      const needsMigration =
        doc.status === undefined ||
        (doc as any).isApproved !== undefined ||
        (doc as any).token !== undefined ||
        (doc as any).expiresAt !== undefined;

      if (!needsMigration) continue;

      const status = doc.status ?? ((doc as any).isApproved === true ? "approved" : "pending");
      await ctx.db.patch(doc._id, {
        status,
        isApproved: undefined,
        token: undefined,
        expiresAt: undefined,
      });
      migrated++;
    }

    return { migrated, total: docs.length };
  },
});

/**
 * One-time migration: renames importedTransactionId → bankReferenceId on transactions.
 *
 * Run once via Convex dashboard after deploying, then remove this file.
 */
export const migrateTransactionIds = internalMutation({
  handler: async (ctx) => {
    const docs = await ctx.db.query("transactions").collect();
    let migrated = 0;

    for (const doc of docs) {
      const old = (doc as any).importedTransactionId;
      if (old === undefined) continue;

      await ctx.db.patch(doc._id, {
        bankReferenceId: doc.bankReferenceId ?? old,
        importedTransactionId: undefined,
      });
      migrated++;
    }

    return { migrated, total: docs.length };
  },
});
