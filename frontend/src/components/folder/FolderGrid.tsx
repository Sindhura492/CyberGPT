import { EllipsisVertical, FolderCheck, Search, Trash2 } from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import type { Folder } from "../../types/reports";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@components/ui/dropdown-menu";
import { showSuccessToast } from "../toaster";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface FolderGridProps {
	folders: Folder[];
	onCreateFolder: () => void;
	onFolderClick: (folderId: string) => void;
}

export function FolderGrid({
	folders,
	onCreateFolder,
	onFolderClick,
}: FolderGridProps) {
	const deleteReportFolderById = useMutation(api.reports.deleteReportFolder);

	const deleteReportFolder = async (
		folderId: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation();
		const responseAfterDelete = await deleteReportFolderById({ folderId });
		if (!responseAfterDelete) {
			return;
		}
		showSuccessToast(responseAfterDelete.message);
	};
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input placeholder="Search folders..." className="pl-8" />
				</div>
				<Button onClick={onCreateFolder}>Create Folder</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{folders.map((folder, index) => (
					<div
						key={`${folder.id}-${index}`}
						className="relative group"
						onClick={() => onFolderClick(folder.id)}
						onKeyUp={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								onFolderClick(folder.id);
							}
						}}
					>
						<Button
							variant="outline"
							className="h-32 w-full flex flex-col items-center justify-center gap-2 hover:bg-sidebar"
						>
							<FolderCheck className="h-10 w-10" />
							<span>{folder.name}</span>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 opacity-100 transition-opacity"
									onClick={(
										e: React.MouseEvent<HTMLButtonElement>,
									) => e.stopPropagation()}
								>
									<EllipsisVertical className="h-5 w-5 text-sidebar-foreground" />
									<span className="sr-only">
										Open folder menu
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem
									onClick={(e: React.MouseEvent) =>
										deleteReportFolder(folder.id, e)
									}
									className="text-red-600"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									<span>Delete</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				))}
			</div>
		</div>
	);
}
