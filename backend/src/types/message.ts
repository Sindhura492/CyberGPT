export type ChatMessage = {
	role: "user" | "assistant";
	content: string;
	useRAG?: boolean;
};
