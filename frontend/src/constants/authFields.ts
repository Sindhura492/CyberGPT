import { z } from "zod";

export const registerFields = [
	{
		name: "firstName",
		type: "text",
		placeholder: "First name",
		validation: z
			.string()
			.trim()
			.min(1, { message: "First name is required." })
			.min(4, { message: "First name must be at least 4 characters." })
			.max(50, { message: "First name must not exceed 50 characters." })
			.regex(/^[A-Za-z]+$/, {
				message: "First name must only contain letters.",
			}),
	},
	{
		name: "lastName",
		type: "text",
		placeholder: "Last name",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Last name is required." })
			.min(4, { message: "Last name must be at least 4 characters." })
			.max(50, { message: "Last name must not exceed 50 characters." })
			.regex(/^[A-Za-z]+$/, {
				message: "Last name must only contain letters.",
			}),
	},
	{
		name: "username",
		type: "text",
		placeholder: "Username",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Username is required." })
			.min(4, { message: "Username must be at least 4 characters." })
			.max(30, { message: "Username must not exceed 30 characters." })
			.regex(/^[A-Za-z0-9]+$/, {
				message: "Username must only contain alphanumeric characters.",
			}),
	},
	{
		name: "email",
		type: "email",
		placeholder: "Email",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Email is required." })
			.email({ message: "Please enter a valid email address." })
			.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
				message: "Email address should not contain invalid characters.",
			}),
	},
	{
		name: "password",
		type: "password",
		placeholder: "Password",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Password is required." })
			.min(8, { message: "Password must be at least 8 characters." })
			.regex(/[A-Z]/, {
				message: "Password must contain at least one uppercase letter.",
			})
			.regex(/[a-z]/, {
				message: "Password must contain at least one lowercase letter.",
			})
			.regex(/[0-9]/, {
				message: "Password must contain at least one number.",
			})
			.regex(/[@$!%*?&{}+_]/, {
				message:
					"Password must contain at least one special character.",
			}),
	},
	{
		name: "confirmPassword",
		type: "password",
		placeholder: "Confirm New Password",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Confirm Password is required." }),
	},
];

export const loginFields = [
	{
		name: "email",
		type: "email",
		placeholder: "Email",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Email is required." })
			.email({ message: "Please enter a valid email address." })
			.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
				message: "Email address should not contain invalid characters.",
			}),
	},
	{
		name: "password",
		type: "password",
		placeholder: "Password",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Password is required." })
			.min(8, { message: "Password must be at least 8 characters." }),
	},
];

export const forgotPasswordFields = [
	{
		name: "email",
		type: "email",
		placeholder: "Email",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Email is required." })
			.email({ message: "Please enter a valid email address." })
			.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
				message: "Email address should not contain invalid characters.",
			}),
	},
];

export const otpVerificationFields = [
	{
		name: "otp",
		type: "otp",
		placeholder: "Enter OTP",
		validation: z
			.string()
			.trim()
			.length(6, { message: "OTP must be 6 characters." })
			.regex(/^[0-9]+$/, { message: "OTP must only contain numbers." }),
	},
];

export const resetPasswordFields = [
	{
		name: "password",
		type: "password",
		placeholder: "New Password",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Password is required." })
			.min(8, { message: "Password must be at least 8 characters." })
			.regex(/[A-Z]/, {
				message: "Password must contain at least one uppercase letter.",
			})
			.regex(/[a-z]/, {
				message: "Password must contain at least one lowercase letter.",
			})
			.regex(/[0-9]/, {
				message: "Password must contain at least one number.",
			})
			.regex(/[@$!%*?&{}+_]/, {
				message:
					"Password must contain at least one special character.",
			}),
	},
	{
		name: "confirmPassword",
		type: "password",
		placeholder: "Confirm New Password",
		validation: z
			.string()
			.trim()
			.min(1, { message: "Confirm Password is required." }),
	},
];
