// Load environment variables explicitly
import "dotenv/config";
import app from "./app";

const port = process.env.PORT ? Number(process.env.PORT) : 8001;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Backend running on http://localhost:${port}`);
