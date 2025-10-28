import { useState } from "react";
import { supabase } from "@lib/supabase";
import GoogleIcon from "@/assets/GoogleIcon.svg";
import { Button } from "@components/ui/button";

const AuthByProviders: React.FC<{ type: string }> = ({ type }) => {
	const [isLoading, setIsLoading] = useState(false);

	const handleGoogleLogin = async () => {
		try {
			setIsLoading(true);
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback?type=${type}`,
				},
			});
			if (error) throw error;

			// The user will be redirected to Google for authentication
		} catch (error) {
			return error;
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
			<Button
				variant="outline"
				disabled={isLoading}
				onClick={handleGoogleLogin}
				className="w-full"
			>
				<img
					src={GoogleIcon}
					alt="Google Icon"
					className="mr-2 h-4 w-4"
				/>
				Google
			</Button>
		</div>
	);
};

export default AuthByProviders;
