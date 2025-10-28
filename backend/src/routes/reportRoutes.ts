import { Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
	uploadReport,
	deleteReport,
	downloadReport,
} from "../controllers/supaReportController";
const reportRoutes = new Hono();

reportRoutes.post("/api/upload", authMiddleware, uploadReport);
reportRoutes.delete("/api/delete/:fileName", authMiddleware, deleteReport);
reportRoutes.get("/api/download/:fileName", authMiddleware, downloadReport);

export { reportRoutes };
