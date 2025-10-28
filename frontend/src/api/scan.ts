import type { SonarScanReport } from "../types/sastTypes";
import type { ScanResult } from "../types/zap-scan";
import axiosInstance from "./axios";
import { BASE_URL } from "./config.backend";

interface scanPayload {
	url: string;
	complianceStandard: string;
	scanType: string;
	userId: number;
}

interface githubScanPayload {
	githubUrl: string;
	repoType: string;
	accessToken?: string;
	userId: string | null | undefined;
}

const scan = (payload: scanPayload) =>
	axiosInstance.post("/zap/spider-scan", payload);

const scanWithProgress = async (payload: scanPayload) => {
	// const resultsResponse = axiosInstance.post("/zap/spider-scan", payload);
	const resultsResponse = axiosInstance.post("/zap/baseline-scan", payload);

	return resultsResponse;
};

const scanReportGeneration = async (payload: ScanResult) => {
	const response = await fetch(`${BASE_URL}/chat/scan/summary`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ scanResults: payload }),
	});

	if (!response.body) {
		throw new Error("No response body");
	}

	return response; // Return the readable stream for processing
};

const scanSastReportGeneration = async (payload: SonarScanReport) => {
	const response = await fetch(`${BASE_URL}/chat/sast-scan/summary`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ scanResults: payload }),
	});

	if (!response.body) {
		throw new Error("No response body");
	}

	return response; // Return the readable stream for processing
};

const detailedReportGeneration = async (payload: ScanResult) => {
	const resultsResponse = axiosInstance.post(
		`${BASE_URL}/chat/detailed/summary`,
		{
			scanResults: payload,
		},
	);

	return resultsResponse;
};

const detailedSastReportGeneration = async (payload: SonarScanReport) => {
	const resultsResponse = axiosInstance.post(
		`${BASE_URL}/chat/detailed/sast-summary`,
		{
			scanSastResults: payload,
		},
	);

	return resultsResponse;
};

const scanWithGithubURL = async (payload: githubScanPayload) => {
	const resultsResponse = axiosInstance.post("/zap/sonar-scan", payload);
	return resultsResponse;
};

export const scanApis = {
	scan,
	scanWithProgress,
	scanReportGeneration,
	detailedReportGeneration,
	scanWithGithubURL,
	scanSastReportGeneration,
	detailedSastReportGeneration,
};
