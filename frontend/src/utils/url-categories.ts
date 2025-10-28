type CategorizedData = {
	[category: string]: {
		[riskLevel: string]: { url: string; riskLevel: string }[];
	};
};

export const categorizeData = (
	data: { url: string; riskLevel: string }[],
): CategorizedData => {
	const categories = {
		auth: (url: string) => url.includes("auth") || url.includes("login"),
		api: (url: string) => /^https?:\/\/.+\/api(\/|$|\?|#)/.test(url),
		js: (url: string) => url.endsWith(".js"),
		css: (url: string) => url.endsWith(".css"),
		unauth: (url: string) =>
			url.includes("unauth") ||
			url.includes("ftp") ||
			/\b(sitemap\.xml|robots\.txt|favicon(\.js|\.ico))\b/.test(url),
		others: () => true,
	};

	const riskLevels = ["Critical", "High", "Medium", "Low", "Info"];

	const categorizedData: CategorizedData = Object.keys(categories).reduce(
		(acc, category) => {
			acc[category] = riskLevels.reduce(
				(subAcc, level) => {
					subAcc[level] = [];
					return subAcc;
				},
				{} as {
					[riskLevel: string]: { url: string; riskLevel: string }[];
				},
			);
			return acc;
		},
		{} as CategorizedData,
	);

	for (const item of data) {
		const { url, riskLevel } = item;

		const normalizedRiskLevel = riskLevel.replace(/\s*\(.*?\)/g, "").trim();

		for (const [category, predicate] of Object.entries(categories)) {
			if (predicate(url)) {
				const normalizedRisk = riskLevels.find((level) =>
					normalizedRiskLevel
						.toLowerCase()
						.includes(level.toLowerCase()),
				);

				if (normalizedRisk) {
					categorizedData[category][normalizedRisk].push({
						url,
						riskLevel,
					});
				}
				break;
			}
		}
	}

	return categorizedData;
};
