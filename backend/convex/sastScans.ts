import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const saveSonarScan = mutation({
	args: {
		userId: v.string(),
		repoType: v.string(),
		projectKey: v.string(),
		metrics: v.optional(
			v.object({
				coverage: v.string(),
				bugs: v.string(),
				reliability_rating: v.string(),
				code_smells: v.string(),
				duplicated_lines_density: v.string(),
				security_rating: v.string(),
				ncloc: v.string(),
				vulnerabilities: v.string(),
				software_quality_maintainability_rating: v.string(),
			}),
		),
		createdAt: v.number(),
	},
	handler: async (
		ctx,
		{ userId, repoType, projectKey, metrics, createdAt },
	) => {
		const scanId = await ctx.db.insert("staticScans", {
			userId,
			repoType,
			projectKey,
			metrics,
			createdAt,
		});

		return { scanId };
	},
});

export const saveHotspot = mutation({
	args: {
		staticScanId: v.id("staticScans"),
		message: v.string(),
		vulnerabilityProbability: v.string(),
		component: v.string(),
		line: v.number(),
		review_status: v.boolean(),
	},
	handler: async (
		ctx,
		{
			staticScanId,
			message,
			vulnerabilityProbability,
			component,
			line,
			review_status,
		},
	) => {
		const hotspotId = await ctx.db.insert("hotspotList", {
			staticScanId,
			message,
			vulnerabilityProbability,
			component,
			line,
			review_status,
		});

		return { hotspotId };
	},
});

export const saveIssue = mutation({
	args: {
		staticScanId: v.id("staticScans"),
		message: v.string(),
		component: v.string(),
		line: v.number(),
		severity: v.string(),
		tags: v.array(v.string()),
	},

	handler: async (
		ctx,
		{ staticScanId, message, component, line, severity, tags },
	) => {
		const issueId = await ctx.db.insert("issueList", {
			staticScanId,
			message,
			component,
			line,
			severity,
			tags,
		});

		return { issueId };
	},
});

export const saveIssueInfo = mutation({
	args: {
		issueId: v.id("issueList"),
		message: v.string(),
		component: v.string(),
		line: v.number(),
		severity: v.string(),
		rule: v.object({
			key: v.string(),
			name: v.string(),
			remediationSteps: v.array(
				v.object({
					context: v.string(),
					description: v.string(),
					problemCodeSnippet: v.string(),
					remediationCodeSnippet: v.string(),
				}),
			),
		}),
	},
	handler: async (
		ctx,
		{ issueId, message, component, line, severity, rule },
	) => {
		const filteredRule = {
			key: rule.key,
			name: rule.name,
			remediationSteps: rule.remediationSteps.map(
				({
					context,
					description,
					problemCodeSnippet,
					remediationCodeSnippet,
				}) => ({
					context,
					description,
					problemCodeSnippet,
					remediationCodeSnippet,
				}),
			),
		};

		const issueInfoId = await ctx.db.insert("issueInfo", {
			issueId,
			message,
			component,
			line,
			severity,
			rule: filteredRule,
		});

		return { issueInfoId };
	},
});

export const fetchSASTScansByUserId = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, { userId }) => {
		const scans = await ctx.db
			.query("staticScans")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();
		return scans;
	},
});

export const fetchHotspotListByScanId = query({
	args: {
		staticScanId: v.id("staticScans"),
	},
	handler: async (ctx, { staticScanId }) => {
		const hotspots = await ctx.db
			.query("hotspotList")
			.withIndex("by_staticScanId", (q) => q.eq("staticScanId", staticScanId))
			.collect();
		return hotspots;
	},
});

export const fetchIssueListByScanId = query({
	args: {
		staticScanId: v.id("staticScans"),
	},
	handler: async (ctx, { staticScanId }) => {
		const issues = await ctx.db
			.query("issueList")
			.withIndex("by_staticScanId", (q) => q.eq("staticScanId", staticScanId))
			.collect();
		return issues;
	},
});

export const fetchIssueInfoByIssueId = query({
	args: {
		issueId: v.id("issueList"),
	},
	handler: async (ctx, { issueId }) => {
		const issueInfo = await ctx.db
			.query("issueInfo")
			.withIndex("by_issueId", (q) => q.eq("issueId", issueId))
			.collect();
		return issueInfo;
	},
});

export const fetchRemediationDetailsByIssueId = query({
	args: {
		issueId: v.id("issueList"),
	},
	handler: async (ctx, { issueId }) => {
		const issueInfo = await ctx.db
			.query("issueInfo")
			.withIndex("by_issueId", (q) => q.eq("issueId", issueId))
			.collect();

		return issueInfo.map((info) => ({
			rule: info.rule.key,
			remediationSteps: info.rule.remediationSteps.map((step) => ({
				context: step.context,
				description: step.description,
				problemCodeSnippet: step.problemCodeSnippet,
				remediationCodeSnippet: step.remediationCodeSnippet,
			})),
		}));
	},
});

export const deleteSASTScan = mutation({
	args: {
		scanId: v.id("staticScans"),
	},
	handler: async (ctx, { scanId }) => {
		if (!scanId) {
			throw new Error("scanId is required.");
		}
		const issues = await ctx.db
			.query("issueList")
			.withIndex("by_staticScanId", (q) => q.eq("staticScanId", scanId))
			.collect();

		for (const issue of issues) {
			await ctx.db
				.query("issueInfo")
				.withIndex("by_issueId", (q) => q.eq("issueId", issue._id))
				.collect()
				.then((issueInfos) => {
					for (const issueInfo of issueInfos) {
						ctx.db.delete(issueInfo._id);
					}
				});
		}

		for (const issue of issues) {
			await ctx.db.delete(issue._id);
		}

		const hotspots = await ctx.db
			.query("hotspotList")
			.withIndex("by_staticScanId", (q) => q.eq("staticScanId", scanId))
			.collect();

		for (const hotspot of hotspots) {
			await ctx.db.delete(hotspot._id);
		}
		await ctx.db.delete(scanId);

		return {
			success: true,
			message: "Scan and all related data deleted successfully.",
		};
	},
});

export const deleteHotspots = mutation({
	args: {
		hotspotIds: v.array(v.id("hotspotList")),
	},
	handler: async (ctx, { hotspotIds }) => {
		if (!hotspotIds || hotspotIds.length === 0) {
			throw new Error("At least one hotspot ID is required.");
		}

		for (const hotspotId of hotspotIds) {
			await ctx.db.delete(hotspotId);
		}

		return { success: true, message: "Hotspot deleted successfully." };
	},
});
