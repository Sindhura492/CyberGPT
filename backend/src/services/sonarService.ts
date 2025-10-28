import { exec } from "node:child_process";
import axios from "axios";
import * as fs from "fs-extra";
import * as path from "node:path";
import git from "simple-git";
import type {
	Hotspot,
	Issue,
	Metric,
	SonarReport,
	Rule,
	DescriptionSection,
} from "../types/sastScan";

export class SonarService {
	private readonly SONAR_URL: string =
		process.env.SONAR_URL || "http://localhost:9000";
	private readonly SONAR_TOKEN: string =
		process.env.SONAR_TOKEN || "your_sonar_token";

	public getSonarUrl(): string {
		return this.SONAR_URL;
	}

	async cloneRepository(
		githubUrl: string,
		accessToken?: string,
	): Promise<string> {
		const tempDir = `/tmp/${githubUrl.split("/").pop()?.replace(".git", "") || "repo"}`;

		if (fs.existsSync(tempDir)) {
			await fs.remove(tempDir);
		}

		const gitClient = git();

		if (accessToken) {
			const authenticatedUrl = githubUrl.replace(
				"https://",
				`https://${accessToken}@`,
			);
			await gitClient.clone(authenticatedUrl, tempDir);
		} else {
			await gitClient.clone(githubUrl, tempDir);
		}

		return tempDir;
	}

	async runSonarScanner(repoName: string, localPath: string): Promise<string> {
		const scannerCommand = `
            docker run --rm --platform linux/amd64 --network sonarqube-network \
            -v ${localPath}:/usr/src \
            sonarsource/sonar-scanner-cli \
            -Dsonar.projectKey=${repoName} \
            -Dsonar.sources=/usr/src \
            -Dsonar.host.url=http://sonarqube:9000 \
            -Dsonar.login=${this.SONAR_TOKEN} \
            -Dsonar.scm.exclusions.disabled=true
        `.trim();

		return new Promise((resolve, reject) => {
			exec(scannerCommand, (error, stdout) => {
				if (error) {
					return reject(
						new Error(`SonarScanner execution failed: ${error.message}`),
					);
				}
				const taskIdMatch = stdout.match(/task\?id=([\w\-]+)/);
				if (taskIdMatch) {
					resolve(taskIdMatch[1]);
				} else {
					reject(new Error("Task ID not found in SonarScanner output."));
				}
			});
		});
	}

	public async waitForTaskCompletion(taskId: string): Promise<void> {
		const taskApiUrl = `${this.SONAR_URL}/api/ce/task?id=${taskId}`;
		const authHeader = `Basic ${Buffer.from(`${this.SONAR_TOKEN}:`).toString("base64")}`;

		while (true) {
			const response = await axios.get(taskApiUrl, {
				headers: { Authorization: authHeader },
			});
			const status = response.data.task.status;

			if (status === "SUCCESS") return;
			if (status === "FAILED") throw new Error("SonarQube task failed.");
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}

	public async ensureReportAvailability(projectKey: string): Promise<void> {
		const reportApiUrl = `${this.SONAR_URL}/api/measures/component?component=${projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage`;
		const authHeader = `Basic ${Buffer.from(`${this.SONAR_TOKEN}:`).toString("base64")}`;

		while (true) {
			try {
				const response = await axios.get(reportApiUrl, {
					headers: { Authorization: authHeader },
				});
				if (
					response.data.component?.measures &&
					response.data.component.measures.length > 0
				) {
					break;
				}
			} catch (error) {}
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}
	}

	async fetchSonarReport(projectKey: string): Promise<SonarReport> {
		const metricsApiUrl = `${this.SONAR_URL}/api/measures/component?component=${projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density,security_rating,reliability_rating,software_quality_maintainability_rating,ncloc`;
		const issuesApiUrl = `${this.SONAR_URL}/api/issues/search?componentKeys=${projectKey}&additionalFields=_all`;
		const hotspotsApiUrl = `${this.SONAR_URL}/api/hotspots/search?projectKey=${projectKey}`;
		const authHeader = `Basic ${Buffer.from(`${this.SONAR_TOKEN}:`).toString("base64")}`;

		try {
			const [metricsResponse, issuesResponse, hotspotsResponse] =
				await Promise.all([
					axios.get(metricsApiUrl, {
						headers: { Authorization: authHeader },
					}),
					axios.get(issuesApiUrl, { headers: { Authorization: authHeader } }),
					axios.get(hotspotsApiUrl, {
						headers: { Authorization: authHeader },
					}),
				]);

			//  metrics
			const metrics = metricsResponse?.data?.component?.measures.reduce(
				(acc: Record<string, string | number>, measure: Metric) => {
					acc[measure.metric] = measure.value || 0;
					return acc;
				},
				{},
			);

			const ruleCache: Record<string, Rule> = {};

			//  issues
			const issues = issuesResponse.data.issues;
			const enrichedIssues = await Promise.all(
				issues.map(async (issue: Issue) => {
					let ruleDetails: Rule | null = null;

					if (typeof issue.rule === "string" && ruleCache[issue.rule]) {
						ruleDetails = ruleCache[issue.rule];
					} else if (typeof issue.rule === "string") {
						try {
							const ruleResponse = await axios.get(
								`${this.SONAR_URL}/api/rules/show?key=${issue.rule}`,
								{ headers: { Authorization: authHeader } },
							);
							const fullRuleDetails = ruleResponse.data.rule;

							const remediationSteps =
								fullRuleDetails.descriptionSections
									?.filter(
										(section: DescriptionSection) =>
											section.key === "how_to_fix",
									)
									.map((section: DescriptionSection) => {
										const problemMatch = section.content.match(
											/<pre.*?data-diff-type=["']noncompliant["'].*?>([\s\S]*?)<\/pre>/,
										);
										const remediationMatch = section.content.match(
											/<pre.*?data-diff-type=["']compliant["'].*?>([\s\S]*?)<\/pre>/,
										);

										return {
											context: section.context?.displayName || "General",
											description:
												section.content || "No description available",
											problemCodeSnippet: problemMatch
												? problemMatch[1].trim()
												: "No problem code snippet available",
											remediationCodeSnippet: remediationMatch
												? remediationMatch[1].trim()
												: "No remediation code snippet available",
										};
									}) || [];

							ruleDetails = {
								key: fullRuleDetails.key,
								name: fullRuleDetails.name,
								description:
									fullRuleDetails.htmlDesc || "No description available",
								remediation: {
									func: fullRuleDetails.remFnType || "Unknown",
									constantCost: fullRuleDetails.remFnBaseEffort || "Unknown",
								},
								remediationSteps,
							};

							// Cache rule details
							ruleCache[issue.rule] = ruleDetails;
						} catch (error) {
							console.error(
								`Failed to fetch rule details for ${issue.rule}:`,
								error,
							);
						}
					}

					const remediationStep =
						(ruleDetails?.remediationSteps || [])[0] || {};
					return {
						key: issue.key,
						type: issue.type,
						severity: issue.severity,
						message: issue.message,
						component: issue.component,
						line: issue.line,
						tags: issue.tags || [],
						rule: {
							key: ruleDetails?.key || "",
							name: ruleDetails?.name || "",
							description: ruleDetails?.description || "",
							remediation: ruleDetails?.remediation || {
								func: "",
								constantCost: "",
							},
							remediationSteps: ruleDetails?.remediationSteps || [],
						},
					};
				}),
			);

			//  hotspots
			const hotspots = hotspotsResponse.data.hotspots.map(
				(hotspot: Hotspot) => ({
					key: hotspot.key,
					status: hotspot.status,
					message: hotspot.message,
					vulnerabilityProbability:
						hotspot.vulnerabilityProbability || "Unknown",
					component: hotspot.component || "Unknown",
					line: hotspot.line || -1,
				}),
			);

			return {
				metrics,
				issues: enrichedIssues,
				hotspots,
			};
		} catch (error) {
			console.error("Error fetching SonarQube data:", error);
			throw new Error(
				"Failed to fetch SonarQube report. Check the logs for details.",
			);
		}
	}

	async analyzeRepository(githubUrl: string): Promise<SonarReport> {
		const localPath = await this.cloneRepository(githubUrl);
		const repoName = path.basename(localPath);

		const taskId = await this.runSonarScanner(repoName, localPath);
		await this.waitForTaskCompletion(taskId);
		await this.ensureReportAvailability(repoName);

		return this.fetchSonarReport(repoName);
	}
}
