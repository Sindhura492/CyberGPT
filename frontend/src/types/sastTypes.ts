export interface RemediationStep {
	context: string;
	description: string;
	problemCodeSnippet?: string;
	remediationCodeSnippet?: string;
}

export interface Issue {
	key: string;
	message: string;
	severity: string;
	component: string;
	line: number;
	rule: {
		key: string;
		name: string;
		description: string;
		remediation: {
			func?: string;
			constantCost?: string;
		};
		remediationSteps?: RemediationStep[];
		standards?: Array<{
			name: string;
			link: string;
		}>;
	};
}
export interface Hotspot {
	key: string;
	status: string;
	message: string;
	vulnerabilityProbability?: string;
	line?: number;
	component?: string;
}
export interface SonarScanReport {
	message: string;
	projectKey: string;
	report: {
		metrics: {
			coverage: string;
			bugs: string;
			reliability_rating: string;
			code_smells: string;
			duplicated_lines_density: string;
			security_rating: string;
			ncloc: string;
			vulnerabilities: string;
			software_quality_maintainability_rating: string;
		};
		issues: Issue[];
		hotspots: Hotspot[];
	};
}
