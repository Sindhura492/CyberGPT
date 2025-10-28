import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import useChatActionStore from "../../store/chatActions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function NewChat() {
	const navigate = useNavigate();
	const { clearStore } = useChatActionStore();

	const handleNewChat = () => {
		clearStore();
		navigate("/chatbot");
	};

	return (
		<TooltipProvider>
			<SidebarMenu className="m-0">
				<SidebarMenuItem>
					<div className="flex justify-center px-4 py-3">
						<Tooltip>
							<TooltipTrigger asChild>
								<SidebarMenuButton
									onClick={handleNewChat}
									className="flex items-center justify-center gap-2 rounded-lg bg-black text-white dark:bg-white dark:text-black px-4 py-2.5 font-medium text-sm shadow-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
								>
									<Plus className="h-4 w-4 text-white dark:text-black" />
									<span>New chat</span>
								</SidebarMenuButton>
							</TooltipTrigger>
							<TooltipContent side="right" align="center">
								New Chat
							</TooltipContent>
						</Tooltip>
					</div>
				</SidebarMenuItem>
			</SidebarMenu>
		</TooltipProvider>
	);
}
