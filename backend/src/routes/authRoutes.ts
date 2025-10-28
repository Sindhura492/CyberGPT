import { Hono } from "hono";
import { cors } from "hono/cors";
import { login, register } from "../controllers/authController";

const authRoutes = new Hono();

// Add CORS specifically for auth routes
authRoutes.use("*", cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://appcybergpt.vercel.app", "https://cybergpt-sable.vercel.app"] 
    : "*",
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

authRoutes.options("*", (c) => {
  return c.text("", 200);
});
authRoutes.post("/register", register);
authRoutes.post("/login", login);

export { authRoutes };
