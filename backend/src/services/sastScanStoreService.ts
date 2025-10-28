import { api, convexClient } from "../config/convex";
import type { SonarScanReport, Issue, Hotspot, Rule } from "../types/sastScan";
import type { Id } from "../../convex/_generated/dataModel";
import type { PrismaClient } from "@prisma/client";

export class SASTScanService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async saveSonarScanToConvex(
		scanReport: Omit<SonarScanReport, "report"> & {
			metrics: Record<string, string | number>;
			issues: Issue[];
			hotspots: Hotspot[];
		},
		id: number,
	) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}

			const { projectKey, repoType, metrics, issues, hotspots } = scanReport;

			const createdAt = Date.now();

			const staticScanResponse = await convexClient.mutation(
				api.sastScans.saveSonarScan,
				{
					userId: id.toString(),
					repoType,
					projectKey,
					metrics,
					createdAt,
				},
			);

			const staticScanId = staticScanResponse.scanId as Id<"staticScans">;
			if (!staticScanId) {
				throw new Error("Failed to save static scan data.");
			}

			await this.saveHotspots(hotspots, staticScanId);
			await this.saveIssues(issues, staticScanId);

			return "SAST scan saved successfully.";
		} catch (error) {
			throw new Error(
				`An error occurred while saving SAST scan data: ${(error as Error).message}`,
			);
		}
	}

	private async saveHotspots(
		hotspots: Hotspot[],
		staticScanId: Id<"staticScans">,
	) {
		if (hotspots.length === 0) return;

		const hotspotResponses = await Promise.all(
			hotspots.map(async (hotspot: Hotspot) => {
				const { message, vulnerabilityProbability, component, line, status } =
					hotspot;

				const hotspotPayload = {
					staticScanId,
					message,
					vulnerabilityProbability: vulnerabilityProbability || "Low",
					component: component || "Unknown",
					line: line ?? 0,
					review_status: status === "REVIEWED",
				};

				return await convexClient.mutation(
					api.sastScans.saveHotspot,
					hotspotPayload,
				);
			}),
		);

		if (hotspotResponses.length !== hotspots.length) {
			throw new Error("Failed to save some hotspot data.");
		}
	}

	private async saveIssues(issues: Issue[], staticScanId: Id<"staticScans">) {
		if (issues.length === 0) return;

		const issueResponses = await Promise.all(
			issues.map(async (issue: Issue) => {
				const { message, component, line, severity, tags, rule } = issue;

				const issuePayload = {
					staticScanId,
					message,
					component,
					line: line ?? 0,
					severity,
					tags: tags || [],
				};

				const issueResponse = await convexClient.mutation(
					api.sastScans.saveIssue,
					issuePayload,
				);

				const issueId = issueResponse.issueId as Id<"issueList">;
				if (!issueId) {
					throw new Error("Failed to save issue.");
				}

				if (typeof rule === "object") {
					await this.saveIssueInfo(
						issueId,
						rule,
						message,
						component,
						line,
						severity,
					);
				}

				return issueResponse;
			}),
		);

		if (issueResponses.length !== issues.length) {
			throw new Error("Failed to save some issue data.");
		}
	}

	private async saveIssueInfo(
		issueId: Id<"issueList">,
		rule: Rule,
		message: string,
		component: string,
		line: number | undefined,
		severity: string,
	) {
		const issueInfoPayload = {
			issueId,
			message,
			component,
			line: line ?? 0,
			severity,
			rule: {
				key: rule.key,
				name: rule.name,
				remediationSteps: rule.remediationSteps || [],
			},
		};

		await convexClient.mutation(api.sastScans.saveIssueInfo, issueInfoPayload);
	}
}
