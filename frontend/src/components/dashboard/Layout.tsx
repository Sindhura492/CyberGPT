import { AppSidebar } from "../sidebar/app-sidebar";
import { useLocation, Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Separator } from "../../components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "../../components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import useStore from "../../store/store";
import type { Chats } from "../../types/chats";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../theme/theme-provider";
// import { ModeToggle } from "../theme/mode-toggle";

export function Layout() {
	const location = useLocation();
	const user = useStore((state) => state.user);
	const chats = useQuery(api.chats.getChatsByUserId, user?.id ? { userId: String(user.id) } : "skip") as Chats[] | undefined;
	const { theme, setTheme } = useTheme();

	// Get path segments for breadcrumbs
	const pathSegments = location.pathname.split("/").filter(Boolean);
	return (
		<SidebarProvider className="bg-white">
			<AppSidebar className="bg-gray-100" />
			<SidebarInset>
				<div className="flex flex-col h-screen min-h-0 overflow-hidden">
					<header className="flex h-12 sm:h-14 md:h-16 shrink-0 items-center gap-1 sm:gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 justify-between border-b border-border mb-2 sm:mb-3">
						<div className="flex items-center gap-1 sm:gap-2 px-2 xs:px-3 sm:px-4 min-w-0 flex-1">
							<SidebarTrigger className="-ml-1 flex-shrink-0" />
							<Separator orientation="vertical" className="mr-1 sm:mr-2 h-3 sm:h-4 flex-shrink-0" />
							<Breadcrumb className="min-w-0 flex-1">
								<BreadcrumbList className="flex-wrap">
									{pathSegments.map((segment, index) => {
										const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
										const isLast = index === pathSegments.length - 1;

										// If segment matches a chatId, use the chat title
										const chat = chats?.find((c) => c._id === segment);
										const isHash = /^[a-f0-9]{16,}$/.test(segment); // crude check for hash
										const displaySegment = chat ? chat.title : isHash ? "Chat" : segment.charAt(0).toUpperCase() + segment.slice(1);

										return (
											<BreadcrumbItem key={path} className="max-w-[150px] xs:max-w-[200px] sm:max-w-none">
												{isLast ? (
													<BreadcrumbPage className="text-xs xs:text-sm truncate">{displaySegment}</BreadcrumbPage>
												) : (
													<Link to={path} className="breadcrumb-link text-xs xs:text-sm truncate">
														{displaySegment}
													</Link>
												)}
												{!isLast && <BreadcrumbSeparator className="text-xs xs:text-sm" />}
											</BreadcrumbItem>
										);
									})}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					
					{/* Dark Mode Toggle */}
					<div className="flex items-center px-2 xs:px-3 sm:px-4 flex-shrink-0">
						<button
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="p-1.5 sm:p-2 rounded-lg hover:bg-accent transition-colors duration-200 touch-manipulation"
							title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
						>
							{theme === "dark" ? (
								<Sun className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
							) : (
								<Moon className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
							)}
						</button>
					</div>
				</header>

					<div className="flex-1 min-h-0 flex flex-col overflow-y-auto pt-2 sm:pt-3">
						<Outlet />
					</div>

					{/* Add the help button here */}
					{/* <HelpMenu /> */}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
