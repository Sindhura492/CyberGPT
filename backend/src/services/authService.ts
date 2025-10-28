import type { PrismaClient } from "@prisma/client";
import { comparePasswords, hashPassword } from "../utils/passwordUtils";

export class AuthService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	// Registers a new user (email/password or Google OAuth)

	async register(
		firstName: string,
		lastName: string,
		username: string,
		email: string,
		password?: string,
		authProvider: "email" | "google" = "email",
		supabaseId?: string,
		avatar?: string,
	) {
		// Check if email, username, or supabaseId already exists
		const existingUser = await this.prisma.user.findFirst({
			where: {
				OR: [
					{ email },
					{ username },
					...(supabaseId ? [{ supabaseId }] : []), // Only check supabaseId for Google users
				],
			},
		});

		if (existingUser) {
			if (existingUser.email === email) {
				throw new Error("Email already exists");
			}
			if (existingUser.username === username) {
				throw new Error("Username already exists");
			}
			if (supabaseId && existingUser.supabaseId === supabaseId) {
				throw new Error("Supabase ID already exists");
			}
		}

		let hashedPassword = null;

		// Handle password for email users
		if (authProvider === "email") {
			if (!password) {
				throw new Error("Password is required for email registration");
			}
			hashedPassword = await hashPassword(password);
		}

		return this.prisma.user.create({
			data: {
				firstName,
				lastName,
				username,
				email,
				password: hashedPassword,
				authProvider,
				supabaseId,
				avatar,
			},
		});
	}

	async login(
		email: string,
		password?: string,
		supabaseId?: string,
		authProvider: "email" | "google" = "email",
	) {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			throw new Error("Invalid credentials");
		}

		if (authProvider === "email") {
			// Email user login
			if (user.authProvider !== "email") {
				throw new Error("Please log in using Google");
			}

			if (!password) {
				throw new Error("Password is required for login");
			}

			const isPasswordValid = await comparePasswords(
				password,
				user.password || "",
			);
			if (!isPasswordValid) {
				throw new Error("Invalid credentials");
			}
		} else if (authProvider === "google") {
			// Google user login
			if (user.authProvider !== "google" || user.supabaseId !== supabaseId) {
				throw new Error("Invalid credentials for Google login");
			}
		}

		return user;
	}
}
