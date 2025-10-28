import axiosInstance from "./axios";

const getLatestCVEs = () => axiosInstance.get("/rag/latest-cves");
const sendRagQuery = (question: string) =>
	axiosInstance.post("/rag/query", {
		question,
	});

export const ragApis = {
	getLatestCVEs,
	sendRagQuery,
};
