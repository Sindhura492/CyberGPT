import axios from "axios";
import { AI_AGENT_WEBHOOK_URL } from "./config.agent";

import type { TriggerAgentData } from "../types/agent";

const triggerAgent = (payload: TriggerAgentData) =>
	axios.post(AI_AGENT_WEBHOOK_URL, payload);

export const agentApi = {
	triggerAgent,
};
