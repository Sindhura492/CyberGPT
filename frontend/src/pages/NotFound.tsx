import { Button } from "@components/ui/button";
import { useNavigate } from "react-router-dom";

export function NotFound() {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<h1 className="text-4xl font-bold mb-4">404</h1>
			<p className="text-xl mb-8">Page not found</p>
			<Button onClick={() => navigate(-1)} variant="outline">
				Go back
			</Button>
		</div>
	);
}
