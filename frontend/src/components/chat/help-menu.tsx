import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function HelpMenu() {
	const navigate = useNavigate();
	return (
		<div className="fixed bottom-8 right-8">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full h-8 w-8 hover:bg-muted"
					>
						<HelpCircle className="h-5 w-5" />
						<span className="sr-only">Help menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => navigate("/faqs")}>
						FAQ
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate("/terms")}>
						Terms
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => navigate("/privacy")}>
						Privacy
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
