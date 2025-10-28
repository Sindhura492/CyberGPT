import type { Context } from "hono";
import { spiderAndScan } from "../services/zapService";
import { processJsonForSummary } from "../utils/zapScannerUtils/filteredScanOutput";
import { cweToCveMap } from "../utils/zapScannerUtils/cweToCve";
import type { ZAPResponse, alertData } from "../types/zapAlerts";
import { ScanStoreService } from "../services/scanStoreService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const userService = new ScanStoreService(prisma);

export const spiderAndScanUrl = async (ctx: Context) => {
	try {
		const { targetUrl, complianceStandard, userId } =
			(await ctx.req.json()) as {
				targetUrl: string;
				complianceStandard: string;
				userId: number;
			};

		if (!targetUrl) {
			return ctx.json({ error: "targetUrl is required" }, 400);
		}
		if (!complianceStandard) {
			return ctx.json({ error: "complianceStandard is required" }, 400); // Use number directly
		}

		if (!userId) {
			return ctx.json({ error: "UserId is required" }, 400);
		}

		const results = (await spiderAndScan(targetUrl, complianceStandard)) as {
			alerts: ZAPResponse[];
		};

		const inputData: alertData = {
			alerts: results.alerts || [],
		};

		const filteredResults = processJsonForSummary(inputData, cweToCveMap);
		// await userService.saveZapScanToConvex(
		// 	targetUrl,
		// 	complianceStandard,
		// 	filteredResults,
		// 	userId,
		// );

		return ctx.json(
			{
				targetUrl,
				complianceStandard,
				filteredResults,
			},
			200,
		);
	} catch (error: unknown) {
		if (error instanceof Error) {
			return ctx.json({ error: error.message }, 500);
		}
		return ctx.json({ error: "An unknown error occurred" }, 500);
	}
};
