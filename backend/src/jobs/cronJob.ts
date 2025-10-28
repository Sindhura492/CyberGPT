import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { CVESyncService } from "../services/CVESyncService";

const cveSyncService = new CVESyncService();

new Elysia()
	.use(
		cron({
			name: "sync-cves",
			pattern: "*/5 * * * *", // Every minute for testing
			async run() {
				console.log("Starting CVE sync...", new Date().toISOString());
				try {
					const processedCount = await cveSyncService.syncLatestCVEs();
					console.log(
						`CVE sync completed. Processed ${processedCount} CVEs at ${new Date().toISOString()}`,
					);
				} catch (error) {
					console.error("CVE sync failed:", error);
				}
			},
		}),
	)
	.listen(3000);

console.log("CronJob started on port 3000");

// Run immediate sync when server starts
cveSyncService.syncLatestCVEs().catch(console.error);
