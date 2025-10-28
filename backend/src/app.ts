import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { errorHandler } from "./middlewares/errorHandler";
import { driver } from "./config/neo4j";
import { authRoutes } from "./routes/authRoutes";
import { userRoutes } from "./routes/userRoutes";
import { reportRoutes } from "./routes/reportRoutes";
import { zapRoutes } from "./routes/zapRoutes";
import { chatRoutes } from "./routes/chatRoute";
import { ragRoutes } from "./routes/rag";
import { paymentRoutes } from "./routes/paymentRoutes";
import graphRoutes from "./routes/graphRoutes";
import { dastRoutes } from "./routes/dastRoutes";

const app = new Hono();

// CORS middleware - MUST be first, before other middleware
app.use(
  "*",
  cors({
    origin: ["https://appcybergpt.vercel.app", "http://localhost:3000", "http://localhost:3001"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 600,
  })
);

// Logging
app.use("*", logger());

// Error handler
app.use("*", errorHandler);

// Routes
app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/chat", chatRoutes);
app.route("/api", ragRoutes);
app.route("/api/chat", chatRoutes);
app.route("/reports", reportRoutes);
app.route("/zap", zapRoutes);
app.route("/subscription", paymentRoutes);
app.route("/graph", graphRoutes);
app.route("/dast", dastRoutes);

// Health check
app.get("/health", async (c) => {
  try {
    await driver.verifyConnectivity();
    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        neo4j: "connected",
      },
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      503
    );
  }
});

export default app;
