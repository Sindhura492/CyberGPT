import { PrismaClient } from "@prisma/client";
import type { Context } from "hono";
import type User from "../models/User";
import { AuthService } from "../services/authService";
import { JwtService } from "../services/jwtService";

const prisma = new PrismaClient();
const authService = new AuthService(prisma);
const jwtService = new JwtService();

// Registers a new user (handles both email/password and Google OAuth users)
export const register = async (c: Context) => {
	const {
		firstName,
		lastName,
		username,
		email,
		password,
		authProvider,
		supabaseId,
		avatar,
	} = await c.req.json();

	try {
		const user = await authService.register(
			firstName,
			lastName,
			username,
			email,
			password,
			authProvider || "email",
			supabaseId,
			avatar,
		);
		const token = jwtService.generateToken(user);

		return c.json({ user, token }, 201);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 400);
	}
};

// Logs in a user (handles both email/password and Google OAuth login)
export const login = async (c: Context) => {
	const { authProvider, email, password, supabaseId } = await c.req.json();

	try {
		const user = await authService.login(
			email,
			password,
			supabaseId,
			authProvider || "email",
		);

		const token = jwtService.generateToken(user);
		return c.json({ user, token });
	} catch (error) {
		return c.json({ error: (error as Error).message }, 401);
	}
};
