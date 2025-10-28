export type LoginApiPayloadType = {
	email: string;
	password?: string | null;
	authProvider: string | null;
	supabaseId?: string;
};

export interface AuthResponse {
	user: {
		id: string;
		username: string;
		firstName: string;
		lastName: string;
		avatar: string | null;
		email: string;
		authProvider: string;
		supabaseId: string | null;
		password: string | null;
		createdAt: string;
		updatedAt: string;
	};
	token: string;
}

export interface RegisterApiPayloadType {
	firstName: string;
	lastName: string;
	username: string;
	email: string;
	password?: string | null;
	authProvider: "google" | "email";
	supabaseId?: string;
	avatar?: string;
}

export interface GoogleLoginApiPayloadType {
	email: string;
	password?: string | null;
	authProvider: string | null;
	supabaseId: string;
}

export interface SendOTPApiPayloadType {
	email: string;
}

export interface VerifyOTPApiPayloadType {
	email: string;
	otp: string;
}

export interface ResetPasswordApiPayloadType {
	email: string;
	newPassword: string;
	comfirmPassword: string;
}
