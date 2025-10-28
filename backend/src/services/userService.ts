import type { PrismaClient } from "@prisma/client";
import { transporter } from "../config/nodemailer";
import type User from "../models/User";
import { generateOtp } from "../utils/otpUtils";
import { hashPassword } from "../utils/passwordUtils";
import { uploadImageAndGetUrl } from "../utils/supabaseUtils/avatars";

// Simple in-memory OTP storage (for development)
const otpStorage = new Map<string, { otp: string; expiresAt: number }>();

export class UserService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}

	// TODO: Get user by id
	async getUserById(id: number) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}
			return user;
		} catch (error) {
			throw new Error(
				`An error occurred while fetching the user: ${(error as unknown as Error).message}`,
			);
		}
	}

	// TODO: Update user by id
	async updateUserById(id: number, data: Partial<User>) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}
			return await this.prisma.user.update({ where: { id }, data });
		} catch (error) {
			throw new Error(
				`An error occurred while updating the user ${(error as unknown as Error).message}`,
			);
		}
	}

	async updateAvatar(id: number, file: File) {
		if (!id || Number.isNaN(id)) {
			throw new Error("Invalid user ID");
		}

		if (!(file instanceof File)) {
			throw new Error("Invalid file provided");
		}

		try {
			// Check if the user exists
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}

			// Upload the image and get the URL
			const avatarUrl = await uploadImageAndGetUrl(file);

			// Update the user's avatar in the database
			const updatedUser = await this.prisma.user.update({
				where: { id },
				data: { avatar: avatarUrl },
			});

			return updatedUser; // Return the updated user object
		} catch (error) {
			console.error("Error in updateAvatar service:", error);
			throw new Error(
				`An error occurred while updating the avatar: ${(error as Error).message || "Unknown error"}`,
			);
		}
	}

	// TODO: Delete user by id
	async deleteUserById(id: number) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}
			return await this.prisma.user.delete({ where: { id } });
		} catch (error) {
			throw new Error(
				`An error occurred while deleting the user ${(error as unknown as Error).message}`,
			);
		}
	}

	// TODO: update/change password
	async updatePassword(id: number, password: string) {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			if (!user) {
				throw new Error("User not found");
			}
			const hashedPassword = await hashPassword(password);
			console.log(hashedPassword, "services returned");
			return await this.prisma.user.update({
				where: { id },
				data: { password: hashedPassword },
			});
		} catch (error) {
			throw new Error(
				`An error occurred while updating the password ${(error as unknown as Error).message}`,
			);
		}
	}

	// TODO: Request for password reset
	async requestPasswordReset(email: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { email },
			});
			if (!user) {
				throw new Error("User not found");
			}

			const otp = generateOtp();
			const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
			
			// Store OTP in memory
			otpStorage.set(email, { otp, expiresAt });

			await transporter.sendMail({
				from: process.env.EMAIL_USER,
				to: email,
				subject: "Password Reset OTP",
				text: `Your OTP is: ${otp}`,
			});

			return { message: "OTP sent to email" };
		} catch (error) {
			throw new Error(
				`An error occurred while requesting the password reset: ${(error as unknown as Error).message}`,
			);
		}
	}

	// TODO: Verify OTP
	async verifyOtp(email: string, otp: string) {
		try {
			const storedData = otpStorage.get(email);
			if (!storedData || storedData.otp !== otp || Date.now() > storedData.expiresAt) {
				throw new Error("Invalid or expired OTP");
			}

			// Remove OTP after successful verification
			otpStorage.delete(email);

			return { message: "OTP verified successfully" };
		} catch (error) {
			throw new Error(
				`An error occurred while verifying the OTP: ${(error as unknown as Error).message}`,
			);
		}
	}

	// TODO: Reset password
	async resetPassword(
		email: string,
		newPassword: string,
		confirmPassword: string,
	) {
		try {
			if (newPassword !== confirmPassword) {
				throw new Error("Passwords do not match");
			}

			const hashedPassword = await hashPassword(newPassword);
			await this.prisma.user.update({
				where: { email },
				data: { password: hashedPassword },
			});

			return { message: "Password reset successfully" };
		} catch (error) {
			throw new Error(
				`An error occurred while resetting the password ${(error as unknown as Error).message}`,
			);
		}
	}
}
