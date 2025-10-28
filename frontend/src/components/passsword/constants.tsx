import { z } from "zod";

export const passwordSchema = z
	.object({
		currentPassword: z.string().min(6, "Current password is required."),
		newPassword: z
			.string()
			.min(6, "New password must be at least 6 characters."),
		confirmPassword: z.string().min(6, "Confirm password is required."),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "New password and confirm password must match",
		path: ["confirmPassword"],
	});

export type PasswordValues = z.infer<typeof passwordSchema>;
