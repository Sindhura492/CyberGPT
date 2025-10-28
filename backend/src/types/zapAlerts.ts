export interface ZAPAlert {
	pluginId: string;
	cweid: string;
	alert: string;
	description: string;
	url: string;
	risk: string;
	compliance?: Record<string, string[]>;
}

export interface Alert {
	name: string;
	risk: RiskLevel;
	url: string;
	method: string;
	cweid: string;
	description: string;
	solution: string;
	alert: string;
	complianceDetails?: string[];
}

export interface InputData {
	alerts: Alert[];
}

export type RiskLevel =
	| "Medium"
	| "High"
	| "Low"
	| "Critical"
	| "Informational";

export interface ProcessedFinding {
	name: string;
	total_count: number;
	description: string;
	solution: string;
	cwe_id: string;
	alert: string;
	compliance_details: string[];
	url_details: { url: string; method: string; risk_level: RiskLevel }[];
	cve_ids: string[];
}

export interface ProcessedSummary {
	total_vulnerabilities: number;
	unique_urls: number;
	total_risks: Record<RiskLevel, number>;
	findings: ProcessedFinding[];
}

export interface ZAPResponse {
	sourceid: string;
	method: string;
	evidence: string;
	pluginId: string;
	cweid: string;
	confidence: string;
	wascid: string;
	description: string;
	messageId: string;
	inputVector: string;
	url: string;
	tags: Record<string, string>;
	reference: string;
	solution: string;
	alert: string;
	param: string;
	attack: string;
	name: string;
	risk: RiskLevel;
	id: string;
	alertRef: string;
	complianceStandard: string;
	complianceDetails: string[];
}

export interface alertData {
	alerts: ZAPResponse[];
}
