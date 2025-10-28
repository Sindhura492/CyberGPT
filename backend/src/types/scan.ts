// export interface ScanResults {
// 	targetUrl: string;
// 	complianceStandard: string;
// 	filteredResults: {
// 		total_vulnerabilities: number;
// 		total_risks: Record<string, number>;
// 		findings: Array<{
// 			name: string;
// 			url_details: Array<{ risk_level: string; url: string }>;
// 			cve_ids: string[];
// 			cwe_id: string;
// 			description: string;
// 			solution: string;
// 		}>;
// 	};
// }

// export interface Finding {
// 	name: string;
// 	url_details: { risk_level: string }[];
// 	description: string;
// 	cwe_id: number;
// 	cve_ids: string[];
// 	solution: string;
// }

export interface ScanResults {
	message: string; // Message indicating the scan status
	totals: {
		totalIssues: number; // Total number of issues
		totalIssue: number; // Redundant, possibly typo but included
		critical: number; // Critical severity issues
		high: number; // High severity issues
		medium: number; // Medium severity issues
		low: number; // Low severity issues
		informational: number; // Informational level issues
	};
	complianceStandardUrl: string; // Compliance standard (e.g., GDPR)
	targetUrl: string; // Target URL of the scan
	scanType: string; // Type of scan performed
	filteredAlerts: FilteredAlert[]; // Array of alerts
}

export interface FilteredAlert {
	pluginid: string; // Plugin ID of the alert
	alertRef: string; // Reference ID for the alert
	alert: string; // Alert title
	name: string; // Name of the alert
	riskcode: string; // Risk code
	confidence: string; // Confidence level
	riskdesc: string; // Risk description
	desc: string; // Description of the issue
	instances: Instance[]; // Array of instances where the alert occurs
	count: string; // Count of occurrences
	solution: string; // Recommended solution
	otherinfo: string; // Additional information
	reference: string; // Reference links or documentation
	cweid: string; // CWE ID related to the issue
	wascid: string; // WASC ID related to the issue
	sourceid: string; // Source ID
	cve_id: string[]; // Array of CVE IDs (empty in the example)
}

export interface Instance {
	uri: string; // URI of the instance
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"; // HTTP method
	param: string; // Parameter affected (if any)
	attack: string; // Attack type (if any)
	evidence: string; // Evidence of the vulnerability
	otherinfo: string; // Additional information
}
