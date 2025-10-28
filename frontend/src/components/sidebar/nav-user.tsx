import { ChevronsUpDown, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/avatar";
import { LucideSettings2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
	useSidebar,
} from "../../components/ui/sidebar";

import type { User } from "../../types/user";
import useStore from "../../store/store";
import { Dialog } from "../dialog";
import { useState } from "react";
import { Logout } from "./logout";

export function NavUser() {
	const { isMobile } = useSidebar();
	const userData = useStore();
	const logout = useStore((state) => state.logout);
	const user: User = userData.user as User;
	const [isDialogOpen, setDialogOpen] = useState(false);
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		window.location.href = "/login";
	};

	return (
		<>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								size="lg"
								className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							>
								<Avatar className="rounded-lg object-cover bg-sidebar border border-sidebar-border">
									<AvatarImage
										src={user?.avatar ?? undefined}
										alt={user?.firstName}
									/>
									<AvatarFallback className="rounded-lg bg-muted text-muted-foreground border border-sidebar-border">
										{user?.firstName.substring(0, 1)}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">
										{user?.firstName}
									</span>
									<span className="truncate text-xs">@{user?.username}</span>
								</div>
								<ChevronsUpDown className="ml-auto size-4" />
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
							side={isMobile ? "bottom" : "right"}
							align="end"
							sideOffset={4}
						>
							<DropdownMenuLabel className="p-0 font-normal">
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<div className="flex gap-2 text-left text-sm leading-tight">
										<Mail className="h-4 w-4 ml-1" />
										<span className="truncate text-xs">{user?.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
							<SidebarSeparator />
							<DropdownMenuLabel className="p-0 font-normal">
								<div>
									{/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
									<a onClick={() => navigate("/accounts")}>
										<SidebarMenuButton tooltip="Preferences">
											<LucideSettings2 className="h-4 w-4" />
											<span>Profile</span>
										</SidebarMenuButton>
									</a>
								</div>
								<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Logout />
								</div>
							</DropdownMenuLabel>
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
			<Dialog
				open={isDialogOpen}
				onClose={() => setDialogOpen(false)}
				title="Log out"
				description="Are you sure you want to log out? You will need to sign in again to access your account."
				onConfirm={handleLogout}
				onCancel={() => setDialogOpen(false)}
				confirmText="Log out"
				cancelText="Cancel"
			/>
		</>
	);
}
