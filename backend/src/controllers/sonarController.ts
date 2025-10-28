import type { Context } from "hono";
import { SonarService } from "../services/sonarService";
import { PrismaClient } from "@prisma/client";
import { SASTScanService } from "../services/sastScanStoreService";
import type { SonarScanReport } from "../types/sastScan";

const prisma = new PrismaClient();
const saveToConvex = new SASTScanService(prisma);

export class SonarController {
	private sonarService = new SonarService();

	async scanRepository(c: Context): Promise<Response> {
		try {
			const { userId, githubUrl, repoType, accessToken } = await c.req.json();

			if (!userId) {
				return c.json({ error: "UserId is required" }, 400);
			}

			if (!githubUrl) {
				return c.json({ error: "GitHub URL is required" }, 400);
			}

			if (!repoType || !["public", "private"].includes(repoType)) {
				return c.json(
					{ error: 'Repository type must be "public" or "private"' },
					400,
				);
			}

			if (repoType === "private" && !accessToken) {
				return c.json(
					{ error: "Access token is required for private repositories" },
					400,
				);
			}

			const repoName =
				githubUrl.split("/").pop()?.replace(".git", "") || "unknown-repo";
			const localPath = `/tmp/${repoName}`;

			const isPrivate = await this.checkRepositoryAccess(
				githubUrl,
				accessToken,
			);

			if (repoType === "public" && isPrivate) {
				return c.json(
					{
						error: "The repository is private, but you specified it as public.",
					},
					400,
				);
			}

			if (repoType === "private" && !isPrivate) {
				return c.json(
					{
						error: "The repository is public, but you specified it as private.",
					},
					400,
				);
			}
			await this.sonarService.cloneRepository(githubUrl, accessToken);
			const taskId = await this.sonarService.runSonarScanner(
				repoName,
				localPath,
			);

			await this.sonarService.waitForTaskCompletion(taskId);
			await this.sonarService.ensureReportAvailability(repoName);

			const sonarReport = await this.sonarService.fetchSonarReport(repoName);

			const { metrics, issues, hotspots } = sonarReport;

			const responsePayload = {
				message: "Scan completed successfully",
				userId,
				projectKey: repoName,
				repoType,
				metrics: sonarReport.metrics as SonarScanReport["metrics"],
				issues,
				hotspots,
			};
			console.log("yooooo completed");
			await saveToConvex.saveSonarScanToConvex(responsePayload, userId);

			return c.json(responsePayload);
		} catch (error) {
			if (error instanceof Error) {
				console.error("Error during repository scan:", error.message);
				return c.json({ error: error.message }, 500);
			}
			console.error("Unknown error during repository scan:", error);
			return c.json({ error: "An unknown error occurred" }, 500);
		}
	}

	private async checkRepositoryAccess(
		githubUrl: string,
		accessToken?: string,
	): Promise<boolean> {
		try {
			const headers: Record<string, string> = {};
			if (accessToken) {
				headers.Authorization = `Bearer ${accessToken}`;
			}

			const apiUrl = githubUrl
				.replace("https://github.com/", "https://api.github.com/repos/")
				.replace(/\.git$/, "");

			const response = await fetch(apiUrl, { headers });
			if (response.status === 404) {
				throw new Error("Repository not found. Check the URL or access token.");
			}

			const repoData = await response.json();
			return repoData.private;
		} catch (error) {
			console.error("Error checking repository access:", error);
			throw new Error(
				"Failed to verify repository access. Check the URL and token.",
			);
		}
	}
}
