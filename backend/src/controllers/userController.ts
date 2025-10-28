import { PrismaClient } from "@prisma/client";
import type { Context } from "hono";
import { UserService } from "../services/userService";
import { comparePasswords, hashPassword } from "../utils/passwordUtils";

const prisma = new PrismaClient();
const userService = new UserService(prisma);

// TODO: Get user by id
export const getUserById = async (c: Context) => {
	const id = c.req.param("id");
	try {
		const user = await userService.getUserById(Number(id));
		return c.json(user);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 404);
	}
};

// TODO: Update user by id
export const updateUserById = async (c: Context) => {
	const id = c.req.param("id");
	const data = await c.req.json();
	try {
		const user = await userService.updateUserById(Number(id), data);
		return c.json(user);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 404);
	}
};

// TODO: Update user avatar
export const updateAvatarById = async (c: Context) => {
	const id = c.req.param("id");
	const { file } = await c.req.parseBody();
	if (!(file instanceof File)) {
		return c.json({ error: "Invalid file provided" }, 400);
	}

	if (!file) {
		return c.json({ error: "No file provided" }, 400);
	}

	try {
		const updatedUser = await userService.updateAvatar(Number(id), file);
		return c.json({
			message: "Avatar updated successfully",
			user: updatedUser,
		});
	} catch (error) {
		return c.json({ error: (error as Error).message }, 500);
	}
};

// TODO: delete user by ID
export const deleteUserById = async (c: Context) => {
	const id = c.req.param("id");
	try {
		await userService.deleteUserById(Number(id));
		return c.json({ message: "User deleted successfully" });
	} catch (error) {
		return c.json({ error: (error as Error).message }, 404);
	}
};

// TODO: Change password
export const changePassword = async (c: Context) => {
	const id = c.req.param("id");
	const { oldPassword, newPassword } = await c.req.json();

	try {
		const user = await userService.getUserById(Number(id));
		if (!user) {
			return c.json({ error: "User not found" }, 404);
		}
		if (!user.password) {
			return c.json({ error: "User password not found" }, 400);
		}
		const isOldPasswordCorrect = await comparePasswords(
			oldPassword,
			user.password,
		);
		if (!isOldPasswordCorrect) {
			return c.json({ error: "Incorrect old password" }, 400);
		}

		const updatedUser = await userService.updatePassword(
			Number(id),
			newPassword,
		);

		return c.json({ updatedUser }, 200);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 500);
	}
};

// TODO: Request the password reset
export const requestReset = async (c: Context) => {
	const { email } = await c.req.json();
	try {
		const response = await userService.requestPasswordReset(email);
		return c.json({ response }, 200);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 400);
	}
};

// TODO: verify OTP with in-memory storage
export const verifyOtp = async (c: Context) => {
	const { email, otp } = await c.req.json();
	try {
		const response = await userService.verifyOtp(email, otp);
		return c.json(response);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 400);
	}
};

// TODO: Reset password using OTP with in-memory storage and hashed password
export const resetPassword = async (c: Context) => {
	const { email, newPassword, confirmPassword } = await c.req.json();
	try {
		const response = await userService.resetPassword(
			email,
			newPassword,
			confirmPassword,
		);
		return c.json(response);
	} catch (error) {
		return c.json({ error: (error as Error).message }, 400);
	}
};
