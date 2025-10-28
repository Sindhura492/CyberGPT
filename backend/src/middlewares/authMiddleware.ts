import type { Context, Next } from "hono";
import { JwtService } from "../services/jwtService";

const jwtService = new JwtService();

export const authMiddleware = async (c: Context, next: Next) => {
	const token = c.req.header("Authorization")?.split(" ")[1];

	if (!token) {
		return c.json({ error: "No token provided" }, 401);
	}

	try {
		const decoded = jwtService.verifyToken(token);
		c.set("user", decoded);
		await next();
	} catch (error) {
		return c.json({ error }, 401);
	}
};
