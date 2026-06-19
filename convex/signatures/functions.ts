import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import { internalMutation, mutation } from "../_generated/server";
import { getCurrentUser } from "../users/getCurrentUser";

export const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
export const CLEANUP_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

function validateTokenDoc(
	doc: Doc<"signatureTokens"> | null,
): asserts doc is Doc<"signatureTokens"> {
	if (!doc) throw new Error("Ungültiger Link");
	if (doc.expiresAt < Date.now()) throw new Error("Link abgelaufen");
	if (doc.usedAt) throw new Error("Link bereits verwendet");
}

export const createToken = mutation({
	args: {},
	handler: async (ctx) => {
		const user = await getCurrentUser(ctx);
		const token = crypto.randomUUID();

		await ctx.db.insert("signatureTokens", {
			token,
			organizationId: user.organizationId,
			createdBy: user._id,
			expiresAt: Date.now() + TOKEN_EXPIRY_MS,
		});

		return token;
	},
});

export const generateUploadUrl = mutation({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const doc = await ctx.db
			.query("signatureTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		validateTokenDoc(doc);

		return ctx.storage.generateUploadUrl();
	},
});

export const submit = mutation({
	args: {
		token: v.string(),
		signatureStorageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const doc = await ctx.db
			.query("signatureTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		validateTokenDoc(doc);

		// Re-read to prevent race condition
		const freshDoc = await ctx.db.get(doc._id);
		if (freshDoc?.usedAt) throw new Error("Link bereits verwendet");

		await ctx.db.patch(doc._id, {
			signatureStorageId: args.signatureStorageId,
			usedAt: Date.now(),
		});
	},
});

export const cleanupExpired = internalMutation({
	args: {},
	handler: async (ctx) => {
		const expired = await ctx.db
			.query("signatureTokens")
			.filter((q) => q.lt(q.field("expiresAt"), Date.now() - CLEANUP_AFTER_MS))
			.collect();

		for (const token of expired) {
			if (token.signatureStorageId) {
				const fileExists = await ctx.storage.getUrl(token.signatureStorageId);
				if (fileExists) {
					await ctx.storage.delete(token.signatureStorageId);
				}
			}
			await ctx.db.delete(token._id);
		}

		return expired.length;
	},
});
