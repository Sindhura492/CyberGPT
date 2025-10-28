import response from "../response-sast.json";

export const scanData = {
	title: response.projectKey,
	visibility: "PUBLIC",
	lastAnalysis: "3 hours ago",
	status: "Passed",
	metrics: {
		Coverage: { value: `${response.report.metrics.coverage}%`, level: "E" },
		Security: {
			value: response.report.metrics.security_rating,
			level:
				response.report.metrics.security_rating === "5.0" ? "E" : "A",
		},
		Reliability: {
			value: response.report.metrics.reliability_rating,
			level:
				response.report.metrics.reliability_rating === "3.0"
					? "D"
					: "A",
		},
		NCLOC: {
			value: response.report.metrics.ncloc,
			level: "B",
		},
		Maintainability: {
			value: response.report.metrics
				.software_quality_maintainability_rating,
			level: "A",
		},
		Duplications: {
			value: response.report.metrics.duplicated_lines_density,
			level:
				response.report.metrics.duplicated_lines_density > "7"
					? "D"
					: "A",
		},
		CodeSmells: {
			value: response.report.metrics.code_smells,
			level: "D",
		},
		Hotspots: {
			value: response.report.issues.length, // Count of issues as hotspots
			level: response.report.issues.length > 0 ? "E" : "A",
		},
	},
};
