import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "@lib/supabase";
import useStore from "@store/store";
import { authApis } from "../api/auth";
import {
	createGoogleLoginResponseBody,
	createRegisterResponseBody,
} from "../utils/auth-helper";
import type {
	GoogleLoginApiPayloadType,
	RegisterApiPayloadType,
} from "../types/auth";

const AuthCallback = () => {
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const { setUser, setToken } = useStore();
	const location = useLocation();
	const hasRun = useRef(false);
	const [type, setType] = useState<string | null>(null);

	useEffect(() => {
		if (hasRun.current) return; // Prevent subsequent executions
		hasRun.current = true;

		const handleCallback = async () => {
			try {
				const queryParams = new URLSearchParams(location.search);
				const type = queryParams.get("type");
				setType(type);
				const { data: authData, error: authError } =
					await supabase.auth.getSession();

				if (authError) throw authError;

				if (authData.session) {
					if (type === "register") {
						// Save user to your personal DB
						const registerRequestBody: RegisterApiPayloadType =
							createRegisterResponseBody(
								authData.session.user.user_metadata,
							);
						const response =
							await authApis.register(registerRequestBody);
						const result = response.data;
						// Set user in your app's state
						setUser(result.user);
						setToken(result.token);

						// Redirect to the desired page after successful login
					} else if (type === "login") {
						const loginRequestBody: GoogleLoginApiPayloadType =
							createGoogleLoginResponseBody(
								authData.session.user.user_metadata,
							);
						const response =
							await authApis.googleLogin(loginRequestBody);
						const result = response.data;

						setUser(result.user);
						setToken(result.token);
					}

					navigate("/chatbot");
				} else {
					throw new Error("No session data found");
				}
			} catch (error) {
				setError(
					"An error occurred during authentication. Please try again.",
				);
				return error;
			}
		};

		handleCallback();
	}, [location, navigate, setUser, setToken]);

	if (error) {
		navigate(`/${type}`);
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<p className="ml-2 text-lg">Completing authentication...</p>
		</div>
	);
};

export default AuthCallback;
