import { spawn } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { cweToCveMap } from "../utils/zapScannerUtils/cweToCve";
import type { ZapReport } from "../types/baselineScan";

export const baselineScanService = async (
	targetUrl: string,
	complianceStandard: string,
	scanType: string,
): Promise<{
	report: ZapReport;
	complianceStandard: string;
	rawOutput: string;
	rawError: string;
}> => {
	const tempDir = tmpdir();
	const reportJsonFileName = "scan-report.json";
	const containerJsonReportPath = "scan-report.json";
	const args = [
		"run",
		"--rm",
		"-v",
		`${tempDir}:/zap/wrk/:rw`,
		"zaproxy/zap-stable",
		scanType === "active" ? "zap-full-scan.py" : "zap-baseline.py",
		"-t",
		targetUrl,
		"-J",
		containerJsonReportPath,
		"-d",
	];
	console.log("dockerrrrrrrrr", `docker ${args.join(" ")}`);
	return new Promise((resolve, reject) => {
		const process = spawn("docker", args);

		let errorOutput = "";
		let stdOutput = "";

		process.stdout.on("data", (data) => {
			stdOutput += data.toString();
		});

		process.stderr.on("data", (data) => {
			errorOutput += data.toString();
		});

		process.on("close", (code) => {
			const jsonReportPath = join(tempDir, reportJsonFileName);
			if (existsSync(jsonReportPath)) {
				console.log("JJJJJJJJJJJJ 111111", jsonReportPath);
				try {
					const reportContent: ZapReport = JSON.parse(
						readFileSync(jsonReportPath, "utf-8"),
					);

					for (const site of reportContent.site) {
						for (const alert of site.alerts) {
							if (alert.cweid) {
								alert.cve_id = cweToCveMap[alert.cweid] || [];
							}
						}
					}
					resolve({
						report: reportContent,
						complianceStandard,
						rawOutput: stdOutput,
						rawError: errorOutput,
					});
				} catch (error) {
					reject(
						new Error(
							`Error processing the JSON report: ${(error as Error).message}`,
						),
					);
				}
			} else if (code !== 0) {
				reject(
					new Error(
						`Command failed with code ${code}. OUTPUT: ${stdOutput} ERROR: ${errorOutput}`,
					),
				);
			} else {
				reject(
					new Error("Command completed but JSON report was not generated."),
				);
			}
		});
	});
};
