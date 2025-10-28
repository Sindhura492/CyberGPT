import { NavUser } from "./nav-user";
import { NewChat } from "./new-chat";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
	SidebarSeparator,
} from "../ui/sidebar";
import NavChatHistory from "./nav-chat-history";
import { useState, useEffect } from "react";
import { ChatSearch } from "../chat/chat-search";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	// Keyboard shortcut: Cmd+S or Ctrl+S
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				setIsSearchOpen(true);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, []);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader className="flex items-center justify-between p-0">
				<NewChat />
			</SidebarHeader>
			<SidebarContent className="overflow-hidden h-screen">
				<NavChatHistory onOpenSearch={() => setIsSearchOpen(true)} />
			</SidebarContent>
			<SidebarSeparator />
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
			<ChatSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
		</Sidebar>
	);
}
