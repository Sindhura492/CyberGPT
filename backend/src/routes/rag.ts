import { Hono } from "hono";
import { ChatController } from "../controllers/chatController";

const ragRoutes = new Hono();
const chatController = new ChatController();

// Use the new chatWithJargon logic for GraphRAG queries
ragRoutes.post("/graphrag", (c) => chatController.chatWithJargon(c));

export { ragRoutes };
