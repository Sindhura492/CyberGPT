import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Mutation for saving a summary
export const saveSummary = mutation({
	args: {
		userId: v.string(),
		title: v.string(),
		content: v.string(),
	},
	handler: async (ctx, { userId, title, content }) => {
		const now = Date.now();

		const result = await ctx.db.insert("summaries", {
			userId,
			title,
			content,
			createdAt: now,
		});

		return result;
	},
});

// Query for getting summaries by userId
export const getSummariesByUserId = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const summaries = await ctx.db
			.query("summaries")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		return summaries;
	},
});

// Mutation for deleting a summary by summaryId
export const deleteSummary = mutation({
	args: {
		summaryId: v.id("summaries"),
	},
	handler: async (ctx, { summaryId }) => {
		await ctx.db.delete(summaryId);

		return { success: true };
	},
});
