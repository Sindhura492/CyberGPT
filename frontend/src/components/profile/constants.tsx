import { z } from "zod";

export const profileSchema = z.object({
	firstName: z
		.string()
		.trim() // Removes spaces from both ends.
		.min(1, { message: "First name is required." }) // First-time "required" check
		.min(4, { message: "First name must be at least 4 characters." })
		.max(50, { message: "First name must not exceed 50 characters." })
		.regex(/^[A-Za-z]+$/, {
			message: "First name must only contain letters.",
		}),

	lastName: z
		.string()
		.trim() // Removes spaces from both ends.
		.min(1, { message: "Last name is required." }) // First-time "required" check
		.min(4, { message: "Last name must be at least 4 characters." })
		.max(50, { message: "Last name must not exceed 50 characters." })
		.regex(/^[A-Za-z]+$/, {
			message: "Last name must only contain letters.",
		}),

	username: z
		.string()
		.trim() // Removes spaces from both ends.
		.min(1, { message: "Username is required." }) // First-time "required" check
		.min(4, { message: "Username must be at least 4 characters." })
		.max(30, { message: "Username must not exceed 30 characters." })
		.regex(/^[A-Za-z0-9]+$/, {
			message: "Username must only contain alphanumeric characters.",
		}),

	email: z
		.string()
		.trim() // Removes spaces from both ends.
		.min(1, { message: "Email is required." }) // First-time "required" check
		.email({ message: "Please enter a valid email address." })
		.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
			message: "Email address should not contain invalid characters.",
		}),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const USER_INITIAL_VALUES = {
	firstName: "",
	lastName: "",
	username: "",
	email: "",
};
