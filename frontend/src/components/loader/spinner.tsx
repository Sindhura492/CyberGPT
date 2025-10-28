import { Loader2 } from "lucide-react";

export const Spinner: React.FC = () => (
	<div className="flex justify-center items-center">
		<Loader2 className="h-6 w-6 animate-spin text-gray-500" />
	</div>
);
