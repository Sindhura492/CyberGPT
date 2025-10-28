import { Hono } from "hono";
import { GraphController } from "../controllers/graphController";

const graphController = new GraphController();

const graphRoutes = new Hono();

// Generate graph visualization for a chat message
graphRoutes.post("/generate", async (c) => {
  return graphController.generateGraph(c);
});

// Get graph by message ID
graphRoutes.get("/message/:messageId", async (c) => {
  return graphController.getGraphByMessageId(c);
});

// Get all graphs for a chat
graphRoutes.get("/chat/:chatId", async (c) => {
  return graphController.getGraphsByChatId(c);
});

// Test endpoint to generate sample graph data
graphRoutes.get("/test", async (c) => {
  return graphController.generateTestGraph(c);
});

// Test endpoint to generate real graph with sample data
graphRoutes.get("/test-real", async (c) => {
  return graphController.generateTestRealGraph(c);
});

// Test endpoint to verify user question as main problem node
graphRoutes.get("/test-user-question", async (c) => {
  return graphController.generateTestUserQuestionGraph(c);
});

export default graphRoutes;
