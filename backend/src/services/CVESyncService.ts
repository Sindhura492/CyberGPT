import { sleep } from "bun";
import { Document } from "langchain/document";
import { PineconeService } from "./pineconeStore";
import type {
	CVEDocument,
	Weakness,
	WeaknessDescription,
} from "../types/latestCves";

export class CVESyncService {
	private pinecone: PineconeService | null = null;
	private readonly NIST_API_URL =
		"https://services.nvd.nist.gov/rest/json/cves/2.0";
	private readonly BATCH_SIZE = 100;

	constructor() {
		this.init();
	}

	private async init() {
		this.pinecone = await PineconeService.getInstance();
		if (!this.pinecone) {
			console.warn("Pinecone not configured, CVE sync will be disabled");
		}
	}

	private isValidCVE(cve: CVEDocument): boolean {
		// Filter out rejected and reserved CVEs
		if (cve.vulnStatus === "Rejected") {
			return false;
		}
		return true;
	}

	formatCVEForStorage(cve: CVEDocument): Document | null {
		// First check if the CVE is valid
		if (!this.isValidCVE(cve)) {
			return null;
		}

		try {
			// Extract description - prefer English
			const description =
				cve.descriptions.find((desc) => desc.lang === "en")?.value?.trim() ||
				"No description available.";

			// Extract and clean references
			const references =
				cve.references
					?.filter((ref) => ref.url && ref.url.trim().length > 0)
					?.map((ref) => ref.url.trim())
					?.join("\n") || "No references available.";

			// Extract CVSS data with validation
			const cvssV31 = cve.metrics.cvssMetricV31?.[0]?.cvssData;
			const cvssV2 = cve.metrics.cvssMetricV2?.[0]?.cvssData;
			const cvssData = cvssV31 || cvssV2;

			const cvssScore = cvssData?.baseScore ?? "Not available";
			const severity = cvssData?.baseSeverity ?? "Not available";
			const vectorString = cvssData?.vectorString ?? "Not available";

			// Clean and format weaknesses
			const weaknesses =
				cve.weaknesses
					?.flatMap((weakness) =>
						weakness.description
							.map((desc) => desc.value.trim())
							.filter(
								(value) =>
									value !== "NVD-CWE-noinfo" && value !== "NVD-CWE-Other",
							),
					)
					?.filter(Boolean)
					?.join(", ") || "Not specified";

			// Process affected products with validation
			const affectedProducts =
				cve.configurations?.nodes
					?.flatMap((node) =>
						node.cpeMatch.map((match) => {
							const parts = match.criteria.split(":");
							return {
								vendor: parts[3] || "Unknown",
								product: parts[4] || "Unknown",
								version: parts[5] || "Unknown",
								update: parts[6] || "Any",
								edition: parts[7] || "Any",
							};
						}),
					)
					?.filter(
						(product) =>
							product.vendor !== "Unknown" || product.product !== "Unknown",
					) || [];

			const pageContent = {
				id: cve.id,
				description,
				references,
				cvssScore,
				severity,
				vectorString,
				weaknesses,
				affectedProducts,
				mitigation:
					"Upgrade affected software to the latest patched version or consult vendor advisories.",
			};

			return new Document({
				id: cve.id,
				pageContent: JSON.stringify(pageContent),
				metadata: {
					id: cve.id,
					publishedDate: cve.published,
					lastModifiedDate: cve.lastModified,
					severity,
					cvssScore,
					weaknesses,
					vendorProject: cve.sourceIdentifier,
					vulnStatus: cve.vulnStatus,
				},
			});
		} catch (error) {
			console.error(`Error formatting CVE ${cve.id}:`, error);
			return null;
		}
	}

	async syncLatestCVEs() {
		try {
			const nowDate = new Date();
			const pastDate = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);

			const params = new URLSearchParams({
				pubStartDate: pastDate.toISOString(),
				pubEndDate: nowDate.toISOString(),
				resultsPerPage: this.BATCH_SIZE.toString(),
				startIndex: "0",
			});

			let hasMoreResults = true;
			let totalProcessed = 0;
			let startIndex = 0;

			while (hasMoreResults) {
				params.set("startIndex", startIndex.toString());
				const response = await fetch(`${this.NIST_API_URL}?${params}`);

				if (!response.ok) {
					throw new Error(`API request failed: ${response.statusText}`);
				}

				const data = await response.json();

				const cves: CVEDocument[] = data.vulnerabilities.map(
					(vuln: { cve: CVEDocument }) => vuln.cve,
				);

				if (cves.length === 0) {
					hasMoreResults = false;
					continue;
				}

			const documents = cves
				.map((cve) => this.formatCVEForStorage(cve))
				.filter((doc): doc is Document => doc !== null);

			console.log("Adding Documents to Pinecone:", documents);
			
			if (!this.pinecone) {
				console.warn("Pinecone not configured, skipping document storage");
				continue;
			}
			
			await this.pinecone.addDocuments(documents);

				totalProcessed += cves.length;
				startIndex += this.BATCH_SIZE;

				// Respecting NIST API rate limits
				await sleep(1000);
			}

			console.log(`Successfully synced ${totalProcessed} CVEs`);
			return totalProcessed;
		} catch (error) {
			console.error("Error syncing CVEs:", error);
			throw error;
		}
	}
}
