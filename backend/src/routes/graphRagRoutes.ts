import { Hono } from "hono";
import { GraphRAGController } from "../controllers/graphRAGController";

const graphRagRoutes = new Hono();
const controller = new GraphRAGController();

graphRagRoutes.post("/query", (c) => controller.query(c));

export { graphRagRoutes };
     




