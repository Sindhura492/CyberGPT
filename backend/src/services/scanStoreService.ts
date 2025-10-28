import type { PrismaClient } from "@prisma/client";
import type { ProcessedSummary } from "../types/zapAlerts";
import { api, convexClient } from "../config/convex";
import { string } from "zod";
import type { ZapAlert, ZapAlertRequestBody } from "../types/baselineScan";
import type { Id } from "../../convex/_generated/dataModel";

interface urlDetails {
	uri: string;
	method: string;
	attack: string;
	evidence: string;
}

export class ScanStoreService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	async saveZapScanToConvex(filteredResults: ZapAlertRequestBody, id: number) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}

			const {
				targetUrl,
				complianceStandardUrl,
				scanType,
				totals,
				filteredAlerts,
			} = filteredResults;

			const { medium, high, low, critical, informational, totalIssues } =
				totals;

			const scanResponse = await convexClient.mutation(api.scans.saveScan, {
				userId: id.toString(),
				targetUrl,
				scanType,
				complianceStandard: complianceStandardUrl,
				totalRisks: {
					totalVulnerabilities: totalIssues,
					Medium: medium,
					High: high,
					Low: low,
					Critical: critical,
					Informational: informational,
				},
			});

			const scanId = scanResponse.scanId;
			if (!scanId) {
				throw new Error("Failed to save scan data.");
			}

			const vulnerabilityResponse = await Promise.all(
				filteredAlerts.map(async (alerts: ZapAlert) => {
					const { alert, count, riskdesc } = alerts;

					const payload = {
						scanId: scanResponse.scanId,
						alert,
						AffectedUrisCount: count,
						riskDesc: riskdesc,
					};
					return await convexClient.mutation(
						api.vulnerabilities.saveVulnerability,
						payload,
					);
				}),
			);

			const vulnerabilityIds = vulnerabilityResponse.map(
				(response: { vulnerabilityId: Id<"vulnerabilities"> }) =>
					response.vulnerabilityId,
			);

			if (vulnerabilityIds.length !== filteredAlerts.length) {
				throw new Error("Failed to save vulnerability data.");
			}

			const vulInfoResponse = await Promise.all(
				filteredAlerts.map((alert: ZapAlert, index: number) => {
					const {
						instances,
						cve_id,
						cweid,
						reference,
						solution,
						desc,
						confidence,
						riskdesc,
					} = alert;

					const payload = {
						vulnerabilityId: vulnerabilityIds[index] as Id<"vulnerabilities">,
						cweId: cweid,
						cveIds: cve_id || [],
						description: desc,
						affectedUrls: instances.map(
							({ uri, method, attack, evidence }: urlDetails) => ({
								uri,
								method,
								attack,
								evidence,
							}),
						),
						solution,
						riskLevel: riskdesc,
						confidence,
						reference,
					};

					return convexClient.mutation(
						api.vulnerabilityInfo.saveVulnerabilityInfo,
						payload,
					);
				}),
			);

			if (!vulInfoResponse) {
				throw new Error("Failed to save URL data.");
			}

			return "Scans saved successfully.";
		} catch (error) {
			throw new Error(
				`An error occurred while saving data: ${(error as unknown as Error).message}`,
			);
		}
	}
}
