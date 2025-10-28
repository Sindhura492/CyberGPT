export type RiskData = {
	Critical: number;
	High: number;
	Informational: number;
	Low: number;
	Medium: number;
	totalVulnerabilities: number;
};

export type ChartData = {
	name: string;
	value: number;
	color: string;
};
