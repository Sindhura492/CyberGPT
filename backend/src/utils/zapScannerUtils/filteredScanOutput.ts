import type {
	InputData,
	ProcessedFinding,
	ProcessedSummary,
	RiskLevel,
} from "../../types/zapAlerts";

export const processJsonForSummary = (
	data: InputData,
	cweToCveMap: Record<string, string[]>,
): ProcessedSummary => {
	const uniqueUrls = new Set<string>();
	const findings: Record<string, ProcessedFinding> = {};

	for (const alert of data.alerts) {
		uniqueUrls.add(alert.url);

		if (!findings[alert.name]) {
			findings[alert.name] = {
				name: alert.name,
				total_count: 0,
				description: alert.description,
				solution: alert.solution,
				cwe_id: alert.cweid,
				alert: alert.alert,
				compliance_details: alert.complianceDetails || [],
				url_details: [],
				cve_ids: cweToCveMap[alert.cweid] || [],
			};
		}

		const finding = findings[alert.name];
		finding.total_count += 1;

		finding.url_details.push({
			url: alert.url,
			method: alert.method,
			risk_level: alert.risk,
		});
	}

	const riskCount: Record<RiskLevel, number> = {
		Medium: 0,
		High: 0,
		Low: 0,
		Critical: 0,
		Informational: 0,
	};

	for (const alert of data.alerts) {
		if (alert.risk in riskCount) {
			riskCount[alert.risk]++;
		} else {
			console.warn(`Unexpected risk level: ${alert.risk}`);
		}
	}

	return {
		total_vulnerabilities: data.alerts.length,
		unique_urls: uniqueUrls.size,
		total_risks: riskCount,
		findings: Object.values(findings),
	};
};
