import axios from "axios";

const ZAP_BASE_URL = process.env.ZAP_BASE_URL;

export const disableScanner = async (scannerId: number): Promise<void> => {
	try {
		await axios.get(`${ZAP_BASE_URL}/JSON/ascan/action/disableScanners/`, {
			params: { ids: scannerId },
		});
		console.log(`Scanner ${scannerId} disabled successfully.`);
	} catch (error) {
		throw new Error(`Failed to disable scanner ${scannerId}: ${error}`);
	}
};
