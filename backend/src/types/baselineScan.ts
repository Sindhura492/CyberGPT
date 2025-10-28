export interface ZapAlertInstance {
	uri: string;
	method: string;
	param: string;
	attack: string;
	evidence: string;
	otherinfo: string;
}

export interface ZapAlertRequestBody {
	userId: string;
	targetUrl: string;
	complianceStandardUrl: string;
	scanType: string;
	totals: {
		totalIssues: number;
		medium: number;
		high: number;
		low: number;
		critical: number;
		informational: number;
		totalIssue: number;
	};
	filteredAlerts: ZapAlert[];
}

export interface ZapAlert {
	pluginid: string;
	alertRef: string;
	alert: string;
	name: string;
	riskcode: string;
	confidence: string;
	riskdesc: string;
	desc: string;
	instances: ZapAlertInstance[];
	count: string;
	solution: string;
	otherinfo: string;
	reference: string;
	cweid: string;
	wascid: string;
	sourceid: string;
	cve_id?: string[];
}

export interface ZapSite {
	"@name": string;
	"@host": string;
	"@port": string;
	"@ssl": string;
	alerts: ZapAlert[];
}

export interface ZapReport {
	"@programName": string;
	"@version": string;
	"@generated": string;
	site: ZapSite[];
}

export interface ComplianceAlert {
	id: string;
	alert: string;
	compliance: string[];
}
