import { v } from "convex/values";
import { query } from "../_generated/server";

export const validate = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const doc = await ctx.db
			.query("signatureTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!doc) return { valid: false as const, error: "Ungültiger Link" };
		if (doc.expiresAt < Date.now())
			return { valid: false as const, error: "Link abgelaufen" };
		if (doc.usedAt)
			return { valid: false as const, error: "Link bereits verwendet" };

		return { valid: true as const };
	},
});

export const getStatus = query({
	args: { token: v.string() },
	handler: async (ctx, args) => {
		const doc = await ctx.db
			.query("signatureTokens")
			.withIndex("by_token", (q) => q.eq("token", args.token))
			.first();

		if (!doc) return null;

		return {
			signatureStorageId: doc.signatureStorageId,
			usedAt: doc.usedAt,
		};
	},
});
