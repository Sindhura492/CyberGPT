import type React from "react";
import { useState } from "react";

import { useNavigate } from "react-router-dom";

import DynamicForm from "@components/inputs/dynamic-form";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { showErrorToast, showSuccessToast } from "@components/toaster";
import { Button } from "@components/ui/button";

import { authApis } from "@api/auth";
import {
	forgotPasswordFields,
	otpVerificationFields,
	resetPasswordFields,
} from "../constants/authFields";

enum AuthFlowState {
	ForgotPassword = 0,
	VerifyOTP = 1,
	ResetPassword = 2,
}

const ForgotPassword: React.FC = () => {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [flowState, setFlowState] = useState<AuthFlowState>(
		AuthFlowState.ForgotPassword,
	);
	const [email, setEmail] = useState<string>("");

	const handleForgotPassword = async (data: { email: string }) => {
		try {
			setIsLoading(true);
			const { data: responseData } = await authApis.sendOTP(data);
			showSuccessToast(responseData.response.message);
			setEmail(data.email);
			setFlowState(AuthFlowState.VerifyOTP);
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOTP = async (data: { otp: string }) => {
		try {
			setIsLoading(true);
			const { data: responseData } = await authApis.verifyOTP({
				email,
				otp: data.otp,
			});
			showSuccessToast(responseData.message);
			setFlowState(AuthFlowState.ResetPassword);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async (data: {
		password: string;
		confirmPassword: string;
	}) => {
		if (data.password !== data.confirmPassword) {
			showErrorToast("Passwords do not match.");
			return;
		}

		try {
			setIsLoading(true);
			const { data: responseData } = await authApis.resetPassword({
				email,
				newPassword: data.password,
				confirmPassword: data.confirmPassword,
			});
			showSuccessToast(responseData.message);
			navigate("/login");
		} finally {
			setIsLoading(false);
		}
	};

	const renderForm = () => {
		switch (flowState) {
			case AuthFlowState.ForgotPassword:
				return (
					<DynamicForm
						fields={forgotPasswordFields}
						onSubmit={handleForgotPassword}
						submitButton={{
							displayName: "Send Verification Code",
							disabled: isLoading,
						}}
					/>
				);
			case AuthFlowState.VerifyOTP:
				return (
					<DynamicForm
						fields={otpVerificationFields}
						onSubmit={handleVerifyOTP}
						submitButton={{
							displayName: "Verify OTP",
							disabled: isLoading,
						}}
					/>
				);
			case AuthFlowState.ResetPassword:
				return (
					<DynamicForm
						fields={resetPasswordFields}
						onSubmit={handleResetPassword}
						submitButton={{
							displayName: "Reset Password",
							disabled: isLoading,
						}}
					/>
				);
		}
	};

	const getTitle = () => {
		switch (flowState) {
			case AuthFlowState.ForgotPassword:
				return "Forgot Password";
			case AuthFlowState.VerifyOTP:
				return "Verify OTP";
			case AuthFlowState.ResetPassword:
				return "Reset Password";
		}
	};

	const getDescription = () => {
		switch (flowState) {
			case AuthFlowState.ForgotPassword:
				return "Enter your email to receive a verification code if it matches an existing denkMinds account.";
			case AuthFlowState.VerifyOTP:
				return "Enter the verification code sent to your email.";
			case AuthFlowState.ResetPassword:
				return "Enter your new password and confirm it.";
		}
	};

	const handleBack = () => {
		if (flowState === AuthFlowState.VerifyOTP) {
			setFlowState(AuthFlowState.ForgotPassword);
		} else if (flowState === AuthFlowState.ResetPassword) {
			setFlowState(AuthFlowState.VerifyOTP);
		} else {
			navigate("/login");
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
			<Card className="w-full max-w-[400px]">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold text-center">
						{getTitle()}
					</CardTitle>
					{getDescription()}
				</CardHeader>
				<CardContent className="space-y-6 text-center">
					{renderForm()}

					<Button
						variant="outline"
						className="w-full"
						onClick={handleBack}
						disabled={isLoading}
					>
						Back
					</Button>
				</CardContent>
			</Card>
		</div>
	);
};

export default ForgotPassword;
