import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import useStore from "../store/store";
import { authApis } from "../api/auth";
import DynamicForm from "@components/inputs/dynamic-form";
import { Separator } from "@components/ui/separator";

import { loginFields, registerFields } from "../constants/authFields";
import type {
	LoginApiPayloadType,
	RegisterApiPayloadType,
} from "../types/auth";
import { createLoginResponseBody } from "../utils/auth-helper";
import { ModeToggle } from "../components/theme/mode-toggle";
import { Button } from "../components/ui/button";
import { HelpMenu } from "../components/chat/help-menu";

export default function Auth() {
	const navigate = useNavigate();
	const location = useLocation();
	const formType =
		location.pathname === "/login"
			? "login"
			: location.pathname === "/register"
				? "register"
				: null;
	const { setToken, setUser, user } = useStore();
	const [isLoading, setIsLoading] = useState(false);
	const isLoggedIn = !!user;

	const handleSubmit = async (
		data: LoginApiPayloadType | RegisterApiPayloadType,
	) => {
		try {
			setIsLoading(true);

			if (formType === "login") {
				const loginData = createLoginResponseBody(
					data as LoginApiPayloadType,
				);
				const response = await authApis.login(loginData);
				const result = response.data;
				setToken(result.token);
				setUser(result.user);
			} else {
				const registerData = data as RegisterApiPayloadType;
				const response = await authApis.register(registerData);
				const result = response.data;
				setToken(result.token);
				setUser(result.user);
			}

			navigate("/chatbot");
		} finally {
			setIsLoading(false);
		}
	};

	const logout = useStore((state) => state.logout);
	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<>
			<div className="fixed top-4 right-4">
				<ModeToggle />
			</div>
			<div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
				{/* Left Column */}
				<div className="relative hidden bg-violet-900 p-10 text-white md:block">
					<div className="flex h-full flex-col justify-center">
						<div className="flex flex-col items-center justify-center">
							<h1 className="mt-3 text-8xl  font-extrabold">
								{" "}
								CyberGPT{" "}
							</h1>
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="flex items-center justify-center p-8">
					<div className="mx-auto w-full max-w-md space-y-8">
						<div className="flex flex-col items-center justify-center">
						</div>

						{formType && (
							<>
								<div className="space-y-2">
									<h2 className="text-3xl font-bold text-center">
										{formType === "login"
											? "Welcome back"
											: "Create an account"}
									</h2>
								</div>
								<div className="space-y-4">
									<DynamicForm
										fields={
											formType === "login"
												? loginFields
												: registerFields
										}
										onSubmit={handleSubmit}
										submitButton={{
											displayName:
												formType === "login"
													? "Sign in with Email"
													: "Create account",
											disabled: isLoading,
										}}
									/>

									<div className="relative">
										<div className="absolute inset-0 flex items-center">
											<Separator />
										</div>
										<div className="relative flex justify-center text-xs uppercase">
											<span className="bg-background px-2 text-muted-foreground">
												{" "}
												Or continue with{" "}
											</span>
										</div>
									</div>

									<p className="text-center text-sm text-muted-foreground">
										By clicking continue, you agree to our{" "}
										<Link
											to="/terms"
											className="underline hover:text-primary"
										>
											Terms of Service
										</Link>{" "}
										and{" "}
										<Link
											to="/privacy"
											className="underline hover:text-primary"
										>
											Privacy Policy
										</Link>
										.
									</p>

									{formType === "login" && (
										<p className="text-center text-sm">
											<Link
												to="/forgot-password"
												className="text-muted-foreground underline hover:text-primary"
											>
												Forgot your password?
											</Link>
										</p>
									)}

									<p className="text-center text-sm text-muted-foreground">
										{formType === "login"
											? "Don't have an account?"
											: "Already have an account?"}{" "}
										<Link
											to={
												formType === "login"
													? "/register"
													: "/login"
											}
											className="underline underline-offset-4 hover:text-primary"
										>
											{formType === "login"
												? "Register"
												: "Log in"}
										</Link>
									</p>
								</div>
							</>
						)}

						{!formType && (
							<div className="space-y-6">
								<div className="space-y-2 text-center">
									<h2 className="text-3xl font-bold">
										{isLoggedIn
											? `Hey, ${user?.firstName}`
											: "Welcome to CyberGPT"}
									</h2>
									{!isLoggedIn && (
										<p className="text-muted-foreground">
											Choose how you'd like to get started
										</p>
									)}
								</div>

								<div className="space-y-4">
									{isLoggedIn ? (
										<>
											<Button
												className="w-full"
												onClick={() =>
													navigate("/chatbot")
												}
											>
												Back to application
											</Button>
											<Button
												variant="outline"
												className="w-full"
												onClick={handleLogout}
											>
												Log out
											</Button>
										</>
									) : (
										<>
											<Button
												className="w-full"
												onClick={() =>
													navigate("/register")
												}
											>
												Create an account
											</Button>
											<Button
												variant="outline"
												className="w-full"
												onClick={() =>
													navigate("/login")
												}
											>
												Sign in
											</Button>
											<div className="relative">
												<div className="absolute inset-0 flex items-center">
													<Separator />
												</div>
												<div className="relative flex justify-center text-xs uppercase">
													<span className="bg-background px-2 text-muted-foreground">
														Or continue with
													</span>
												</div>
											</div>
											<p className="text-center text-sm text-muted-foreground">
												By continuing, you agree to our{" "}
												<Link
													to="/terms"
													className="underline hover:text-primary"
												>
													Terms of Service
												</Link>{" "}
												and{" "}
												<Link
													to="/privacy"
													className="underline hover:text-primary"
												>
													Privacy Policy
												</Link>
											</p>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
			<HelpMenu />
		</>
	);
}
