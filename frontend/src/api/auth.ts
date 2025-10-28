import axiosInstance from "./axios";

import type {
	GoogleLoginApiPayloadType,
	LoginApiPayloadType,
	RegisterApiPayloadType,
	ResetPasswordApiPayloadType,
	SendOTPApiPayloadType,
	VerifyOTPApiPayloadType,
} from "../types/auth";

//login api
const login = (payload: LoginApiPayloadType) =>
	axiosInstance.post("/auth/login", payload);

//register api
const register = (payload: RegisterApiPayloadType) =>
	axiosInstance.post("/auth/register", payload);

//Sent OTP api
const sendOTP = (payload: SendOTPApiPayloadType) =>
	axiosInstance.post("/users/user/reset_req", payload);

//Verify OTP api
const verifyOTP = (payload: VerifyOTPApiPayloadType) =>
	axiosInstance.post("/users/user/verify", payload);

// Reset Password
const resetPassword = (payload: ResetPasswordApiPayloadType) =>
	axiosInstance.post("/users/user/resetpass", payload);

// GoogleLogin
const googleLogin = (payload: GoogleLoginApiPayloadType) =>
	axiosInstance.post("/auth/login", payload);

export const authApis = {
	login,
	register,
	sendOTP,
	verifyOTP,
	resetPassword,
	googleLogin,
};
