import * as fs from "node:fs";
import * as path from "node:path";
import type { ZapAlert, ComplianceAlert } from "../types/baselineScan";

// Load compliance data from a JSON file
export const loadComplianceData = (): ComplianceAlert[] => {
	const filePath = path.resolve(__dirname, "../data/compliance_mapping.json");
	if (fs.existsSync(filePath)) {
		const fileContent = fs.readFileSync(filePath, "utf-8");
		return JSON.parse(fileContent) as ComplianceAlert[];
	}
	throw new Error(`File not found at path: ${filePath}`);
};

// Filter alerts by compliance standard
export const filterAlertsByCompliance = (
	complianceStandard: string,
	sites: { alerts: ZapAlert[] }[],
	complianceData: ComplianceAlert[],
): ZapAlert[] => {
	if (complianceStandard === "all") {
		return sites.flatMap((site) => site.alerts);
	}

	return sites.flatMap((site) =>
		site.alerts.filter((alert: ZapAlert) =>
			complianceData.some(
				(complianceAlert) =>
					complianceAlert.alert === alert.alert &&
					complianceAlert.compliance.includes(complianceStandard),
			),
		),
	);
};

// Calculate severity counts from filtered alerts
export const calculateSeverityCounts = (filteredAlerts: ZapAlert[]) => {
	const extractPrimarySeverity = (riskdesc: string): string => {
		const match = riskdesc.match(/^[a-zA-Z]+/);
		return match ? match[0].toLowerCase() : "";
	};

	return {
		critical: filteredAlerts
			.filter((alert) => extractPrimarySeverity(alert.riskdesc) === "critical")
			.reduce((acc, alert) => acc + (alert.instances?.length || 0), 0),
		high: filteredAlerts
			.filter((alert) => extractPrimarySeverity(alert.riskdesc) === "high")
			.reduce((acc, alert) => acc + (alert.instances?.length || 0), 0),
		medium: filteredAlerts
			.filter((alert) => extractPrimarySeverity(alert.riskdesc) === "medium")
			.reduce((acc, alert) => acc + (alert.instances?.length || 0), 0),
		low: filteredAlerts
			.filter((alert) => extractPrimarySeverity(alert.riskdesc) === "low")
			.reduce((acc, alert) => acc + (alert.instances?.length || 0), 0),
		informational: filteredAlerts
			.filter(
				(alert) => extractPrimarySeverity(alert.riskdesc) === "informational",
			)
			.reduce((acc, alert) => acc + (alert.instances?.length || 0), 0),
	};
};

// Calculate the total number of issues
export const calculateTotalIssues = (filteredAlerts: ZapAlert[]): number => {
	return filteredAlerts.reduce(
		(acc, alert) => acc + (alert.instances?.length || 0),
		0,
	);
};

// check if a URL is valid
export const isValidUrl = (url: string): boolean => {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
};

// Check if a URL exists
export const checkUrl = async (url: string): Promise<boolean> => {
	try {
		const parsedUrl = new URL(url);
		if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
			throw new Error(`Invalid protocol: ${parsedUrl.protocol}`);
		}
		const response = await fetch(url, { method: "HEAD" });
		return response.ok;
	} catch (error) {
		return false;
	}
};
