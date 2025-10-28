import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query for fetching scans by userId excluding totalRisks
export const fetchScansByUserIdWithoutRisks = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const scans = await ctx.db
			.query("scans")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();
		return scans.map(({ totalRisks, ...rest }) => ({
			...rest,
			totalIssues: totalRisks.totalVulnerabilities,
		}));
	},
});

// Query for fetching totalRisks by userId
export const fetchTotalRisksByUserId = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const scans = await ctx.db
			.query("scans")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();
		return scans.map(({ totalRisks }) => totalRisks);
	},
});

export const fetchTotalRisksByScanId = query({
	args: {
		scanId: v.id("scans"), // The specific scan ID
	},
	handler: async (ctx, { scanId }) => {
		// Fetch the specific scan by scanId
		const scan = await ctx.db.get(scanId);

		// If no scan is found, return null or throw an error
		if (!scan) {
			throw new Error(`No scan found for scanId: ${scanId}`);
		}

		// Return the totalRisks object
		return scan.totalRisks;
	},
});

// Mutation for saving scan details
export const saveScan = mutation({
	args: {
		userId: v.string(),
		targetUrl: v.string(),
		complianceStandard: v.string(),
		scanType: v.string(),
		totalRisks: v.object({
			totalVulnerabilities: v.number(),
			Medium: v.number(),
			High: v.number(),
			Low: v.number(),
			Critical: v.number(),
			Informational: v.number(),
		}),
	},
	handler: async (
		ctx,
		{ userId, targetUrl, complianceStandard, totalRisks, scanType },
	) => {
		const scanId = await ctx.db.insert("scans", {
			userId,
			targetUrl,
			complianceStandard,
			totalRisks,
			scanType,
		});

		return { scanId };
	},
});

// Delete a scan and its related vulnerabilities and vulnerabilityInfo
export const deleteScanAndRelatedData = mutation({
	args: {
		scanId: v.id("scans"), // The specific scan ID
	},
	handler: async (ctx, { scanId }) => {
		// Step 1: Validate scanId
		if (!scanId) {
			throw new Error("scanId is required.");
		}

		// Step 2: Fetch all vulnerabilities related to the scan
		const vulnerabilities = await ctx.db
			.query("vulnerabilities")
			.withIndex("by_scanId", (q) => q.eq("scanId", scanId))
			.collect();

		// Step 3: Delete all related vulnerabilityInfo entries
		for (const vulnerability of vulnerabilities) {
			await ctx.db
				.query("vulnerabilityInfo")
				.withIndex("by_vulnerabilityId", (q) =>
					q.eq("vulnerabilityId", vulnerability._id),
				)
				.collect()
				.then((vulnerabilityInfos) => {
					for (const vulnerabilityInfo of vulnerabilityInfos) {
						ctx.db.delete(vulnerabilityInfo._id);
					}
				});
		}

		// Step 4: Delete the vulnerabilities
		for (const vulnerability of vulnerabilities) {
			await ctx.db.delete(vulnerability._id);
		}

		// Step 5: Delete the scan itself
		await ctx.db.delete(scanId);

		return {
			success: true,
			message: "Scan and related data deleted successfully.",
		};
	},
});

export const fetchScanDetailsByScanId = query({
	args: {
		scanId: v.id("scans"),
	},
	handler: async (ctx, { scanId }) => {
		const scan = await ctx.db.get(scanId);
		if (!scan) {
			throw new Error(`No scan found for scanId: ${scanId}`);
		}
		return scan;
	},
});
