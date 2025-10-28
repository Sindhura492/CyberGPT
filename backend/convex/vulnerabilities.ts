import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query for fetching scans by userId
export const fetchVulnerabilityByScanId = query({
	args: {
		scanId: v.id("scans"),
	},
	handler: async (ctx, { scanId }) => {
		const vulnerabilites = await ctx.db
			.query("vulnerabilities")
			.withIndex("by_scanId", (q) => q.eq("scanId", scanId))
			.collect();
		return vulnerabilites;
	},
});

//  save vulnerability details
export const saveVulnerability = mutation({
	args: {
		scanId: v.id("scans"),
		alert: v.string(),
		AffectedUrisCount: v.string(),

		riskDesc: v.string(),
	},
	handler: async (ctx, { scanId, alert, AffectedUrisCount, riskDesc }) => {
		const now = Date.now();

		const vulnerabilityId = await ctx.db.insert("vulnerabilities", {
			scanId,
			alert,
			AffectedUrisCount,
			riskDesc,
		});

		return { vulnerabilityId };
	},
});
