import type { ZAPAlert } from "../types/zapAlerts";
import axios from "axios";
import { inferCompliance } from "../utils/zapScannerUtils/complianceUtils";
import { disableScanner } from "../utils/zapScannerUtils/disableScanner";

const ZAP_BASE_URL = process.env.ZAP_BASE_URL;

export const spiderAndScan = async (
	targetUrl: string,
	complianceStandard: string,
): Promise<{ alerts: ZAPAlert[] }> => {
	try {
		const scannersToDisable = [40026];
		for (const scannerId of scannersToDisable) {
			await disableScanner(scannerId);
		}
		console.log("Scanners disabled successfully.");

		// Start Spidering
		const spiderResponse = await axios.get(
			`${ZAP_BASE_URL}/JSON/spider/action/scan/`,
			{ params: { url: targetUrl, recurse: true } },
		);

		const spiderScanId = spiderResponse.data.scan;
		let spiderProgress = 0;

		while (spiderProgress < 100) {
			const spiderStatus = await axios.get(
				`${ZAP_BASE_URL}/JSON/spider/view/status/`,
				{ params: { scanId: spiderScanId } },
			);
			spiderProgress = Number(spiderStatus.data.status);
			console.log(`Spider Progress: ${spiderProgress}%`);
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		// Start Active Scanning
		const scanResponse = await axios.get(
			`${ZAP_BASE_URL}/JSON/ascan/action/scan/`,
			{ params: { url: targetUrl } },
		);

		const scanId = scanResponse.data.scan;
		let scanProgress = 0;

		while (scanProgress < 100) {
			const scanStatus = await axios.get(
				`${ZAP_BASE_URL}/JSON/ascan/view/status/`,
				{ params: { scanId } },
			);
			scanProgress = Number(scanStatus.data.status);
			console.log(`Scan Progress: ${scanProgress}%`);
			await new Promise((resolve) => setTimeout(resolve, 5000));
		}

		// Fetch Alerts
		const alertsResponse = await axios.get(
			`${ZAP_BASE_URL}/JSON/core/view/alerts/`,
			{ params: { baseurl: targetUrl } },
		);

		const alerts: ZAPAlert[] = alertsResponse.data.alerts || [];

		const enrichedAlerts = alerts
			.map((alert) => {
				const compliance = inferCompliance(alert.cweid);
				return {
					...alert,
					complianceStandard: complianceStandard,
					complianceDetails: compliance[complianceStandard] || [
						"Uncategorized",
					],
				};
			})
			.filter((alert) => alert.complianceDetails[0] !== "Uncategorized");

		return { alerts: enrichedAlerts };
	} catch (error: unknown) {
		throw new Error("Failed to perform spider/scan");
	}
};
