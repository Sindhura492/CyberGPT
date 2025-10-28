import { Hono } from "hono";
import { dastScanController } from "../controllers/dastScanController";

const dastRoutes = new Hono();

// Basic DAST scan endpoint
dastRoutes.post("/scan", (c) => dastScanController.scanUrl(c));

// DAST scan integrated with chat flow
dastRoutes.post("/scan-chat", (c) => dastScanController.scanUrlFromChat(c));

export { dastRoutes };
