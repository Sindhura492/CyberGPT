import * as fs from "node:fs";
import * as path from "node:path";

interface CveDataMeta {
	ID: string;
}

interface ProblemTypeData {
	description: { lang: string; value: string }[];
}

interface CveItem {
	cve: {
		CVE_data_meta: CveDataMeta;
		problemtype: {
			problemtype_data: ProblemTypeData[];
		};
	};
}

const filePath = path.resolve(__dirname, "../../data/nvd.json");

if (!fs.existsSync(filePath)) {
	throw new Error(`File not found: ${filePath}`);
}

const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
	CVE_Items: CveItem[];
};

// Create a mapping of CWE to CVE
export const cweToCveMap = data.CVE_Items.reduce(
	(map: Record<string, string[]>, item: CveItem) => {
		const cveId = item.cve.CVE_data_meta.ID;

		const cweIds = item.cve.problemtype.problemtype_data.flatMap((ptype) =>
			ptype.description.map((desc) => desc.value.toLowerCase()),
		);

		for (const cweId of cweIds) {
			if (cweId.startsWith("cwe-")) {
				const normalizedCweId = cweId.replace("cwe-", "");
				if (!map[normalizedCweId]) {
					map[normalizedCweId] = [];
				}
				map[normalizedCweId].push(cveId);
			}
		}

		return map;
	},
	{} as Record<string, string[]>,
);
