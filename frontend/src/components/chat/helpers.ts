const REPORT_PATTERNS = {
	EXACT_COMMANDS: [
		/^generate a report$/i,
		/^create a report$/i,
		/^make a report$/i,
	],

	KEYWORDS: ["summary", "generation", "report", "analysis"],
};

const isReportRequest = (lowerPrompt: string): boolean => {
	if (
		REPORT_PATTERNS.EXACT_COMMANDS.some((pattern) =>
			pattern.test(lowerPrompt),
		)
	) {
		return true;
	}

	return REPORT_PATTERNS.KEYWORDS.some((keyword) =>
		lowerPrompt.includes(keyword.toLowerCase()),
	);
};

export { isReportRequest };
