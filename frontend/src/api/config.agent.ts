export const AI_AGENT_WEBHOOK_URL =
	import.meta.env.VITE_NODE_ENV === "development"
		? import.meta.env.VITE_N8N_DEVELOPMENT_WEBHOOK_URL
		: import.meta.env.VITE_N8N_PRODUCTION_WEBHOOK_URL;
