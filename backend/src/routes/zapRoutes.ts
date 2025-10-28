import { Hono } from "hono";
import { spiderAndScanUrl } from "../controllers/zapController";
import { baselineScanHandler } from "../controllers/baselineScanController";
import { SonarController } from "../controllers/sonarController";

const zapRoutes = new Hono();
const sonarController = new SonarController();

zapRoutes.post("/spider-scan", spiderAndScanUrl);
zapRoutes.post("/baseline-scan", baselineScanHandler);
zapRoutes.post("/sonar-scan", (c) => sonarController.scanRepository(c));

export { zapRoutes };
