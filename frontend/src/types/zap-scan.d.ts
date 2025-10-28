import type { SonarScanReport } from "./sastTypes";

export interface Alert {
	risk?: "High" | "Medium" | "Low" | "Informational";
}

export type ScanState = {
	scanResponse: ScanResult;
	setScanResponse: (scanResponse: ScanResult) => void;
	scanSastResponse: SonarScanReport;
	setScanSastResponse: (scanSastResponse: SonarScanReport) => void;
};

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

export enum ScanType {
	PASSIVE = "Passive Scan",
	ACTIVE = "Active Scan",
}

export interface ScanTotals {
	totalIssues: number;
	totalIssue: number;
	critical: number;
	high: number;
	medium: number;
	low: number;
	informational: number;
}

export interface FilteredAlert {
	pluginid: string;
	alertRef: string;
	alert: string;
	name: string;
	riskcode: string;
	confidence: string;
	riskdesc: string;
	desc: string;
	instances: AlertInstance[];
}

export interface ScanResult {
	message: string;
	totals: ScanTotals;
	complianceStandardUrl: string;
	targetUrl: string;
	scanType: ScanType;
	filteredAlerts: FilteredAlert[]; // Can be refined based on alert structure
	userId: number;
}
