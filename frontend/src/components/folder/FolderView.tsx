import { useNavigate } from "react-router-dom";
import {
	EllipsisVertical,
	FileText,
	Trash2,
	TriangleAlert,
} from "lucide-react";
import { Button } from "@components/ui/button";

import type { File, Folder } from "../../types/reports";
import { Card } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { showSuccessToast } from "../toaster";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Spinner } from "../loader/spinner";

type FolderViewProps = {
	folder: Folder;
	reportId: string;
	files: File[];
	onBack: () => void;
};

export function FolderView({ files }: FolderViewProps) {
	const deleteReportById = useMutation(api.reports.deleteReport);
	const navigate = useNavigate();

	const deleteReport = async (folderId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		const responseAfterDelete = await deleteReportById({
			reportId: folderId,
		});
		if (!responseAfterDelete) {
			return;
		}
		showSuccessToast(responseAfterDelete.message);
	};

	// Handler for navigating to a specific file
	const handleFileInteraction = (
		file: File,
		event: React.MouseEvent | React.KeyboardEvent,
	) => {
		if (
			event.type === "click" ||
			(event.type === "keydown" &&
				(event as React.KeyboardEvent).key === "Enter")
		) {
			navigate(`/file/${file._id}`, { state: { file } });
		}
	};

	if (!files) {
		return (
			<div className="items-center justify-center w-full h-full">
				<Spinner />
			</div>
		);
	}
	// Render fallback for empty file list
	if (files.length === 0) {
		return (
			<div>
				<Button
					variant="outline"
					onClick={() => navigate("/reports")}
					className="mb-4"
				>
					Back to Folders
				</Button>
				<Card className="w-full max-w-md mx-auto mt-8 p-8 my-auto shadow-none border-2 border-secondary">
					<Alert variant="default" className="border-none">
						<div className="flex px--5">
							<TriangleAlert className="w-10 h-10 mr-5" />
							<AlertTitle className="text-3xl font-semibold mb-5">
								No Folders Found Yet!
							</AlertTitle>
						</div>
						<AlertDescription className="text-muted-foreground text-base">
							Ask mira to create you a report and come back later.
							Ciao! 👋
						</AlertDescription>
					</Alert>
				</Card>
			</div>
		);
	}

	return (
		<div>
			<Button
				variant="outline"
				onClick={() => navigate("/reports")}
				className="mb-4"
			>
				Back to Folders
			</Button>

			<div className="rounded-lg">
				<div className="overflow-x-auto">
					<table className="table-auto w-full text-left">
						<thead>
							<tr className="bg-sidebar border">
								<th className="p-3">Name</th>
								<th className="p-3">Created on</th>
								<th className="p-3">Type</th>
								<th className="p-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody>
							{files.map((file) => (
								<tr
									key={file._id}
									className="border cursor-pointer hover:bg-sidebar"
									onClick={(event) =>
										handleFileInteraction(file, event)
									}
									onKeyDown={(event) =>
										handleFileInteraction(file, event)
									}
									tabIndex={0}
								>
									<td className="p-3 flex items-center gap-3">
										<FileText className="h-6 w-6 font-black" />
										<span className="truncate text-gray font-semibold">
											{file.fileName}
										</span>
									</td>
									<td className="p-3">
										{file.createdAt
											? new Date(
													file.createdAt,
												).toDateString()
											: "N/A"}
									</td>
									<td className="p-3">
										{file.reportType === "chatSummaryReport"
											? "Chat Summary Report"
											: file.reportType ===
													"vulnerabilityReport"
												? "Vulnerability Report"
												: file.reportType ===
													"vulnerabilityTodo"
												? "Vulnerability TODO"
												: "Report"}
									</td>
									<td className="p-3 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger>
												<EllipsisVertical className="h-5 w-5 text-sidebar-foreground" />
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="w-48 bg-sidebar shadow-lg rounded-md py-1"
											>
												<DropdownMenuItem
													onClick={(
														e: React.MouseEvent,
													) => {
														deleteReport(
															file._id,
															e,
														);
													}}
													className="flex items-center space-x-2 text-red-600"
												>
													<Trash2 className="h-4 w-4" />
													<span>Delete</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
