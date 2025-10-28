import { useEffect, useState } from "react";
import { EmptyState } from "../components/folder/EmptyState";
import { CreateFolderDialog } from "../components/folder/CreateFolderDialog";
import { FolderGrid } from "../components/folder/FolderGrid";
import { FolderView } from "../components/folder/FolderView";
import type { Folder, ConvexFolderType } from "../types/reports";

import { api } from "../convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import useStore from "../store/store";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
// import { Button } from "../components/ui/button";
// import { FolderIcon } from "lucide-react";
import { showErrorToast } from "@components/toaster";
import { Spinner } from "../components/loader/spinner";

export function Reports() {
	const navigate = useNavigate();
	const [folders, setFolders] = useState<Folder[]>([]);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

	const user = useStore((state) => state.user);
	const { reportId: folderIdParams } = useParams<{ reportId: string }>();
	const reportId = folderIdParams as string;

	if (!user) {
		return null;
	}
	const { id } = user;

	// Queries for reports
	const folderData = useQuery(api.reports.getReportFoldersByUser, {
		userId: String(id),
	});
	const filesByFolder = useQuery(
		api.reports.getReportsByFolder,
		reportId && { folderId: String(reportId) },
	);

	const saveReport = useMutation(api.reports.createReportFolder);

	const handleCreateReportFolder = async (name: string) => {
		// Check if a folder with the same name already exists
		if (
			folders.some(
				(folder) => folder.name.toLowerCase() === name.toLowerCase(),
			)
		) {
			showErrorToast("A folder with this name already exists.");
			return;
		}

		// setError(null); // Clear any previous errors

		const newFolder: Folder = {
			id: uuidv4(),
			name: name,
			files: [],
			createdAt: new Date(),
		};

		await saveReport({
			folderName: newFolder.name,
			userId: String(id),
		});
		setFolders([...folders, newFolder]); // Update the folders state
		setIsCreateDialogOpen(false);
	};

	useEffect(() => {
		if (folderData) {
			setFolders(
				folderData.map(
					(item: ConvexFolderType): Folder => ({
						id: item._id,
						name: item.folderName,
						files: [],
						createdAt: new Date(),
					}),
				),
			);
		}
	}, [folderData]);

	const currentFolder = folders.find(
		(folder) => folder.id === currentFolderId,
	);

	// Chat Summaries folder
	// const chatSummaryFolder: Folder = {
	// 	id: "chat-summary",
	// 	name: "Chat Summary",
	// 	files: [],
	// 	createdAt: new Date(),
	// };

	return (
		<div className="flex flex-1 flex-col gap-8 p-8">
			{/* Reports Section */}
			<h2 className="text-xl font-bold">My Space</h2>
			{!folderData ? (
				<Spinner />
			) : (
				<div>
					{folders.length === 0 ? (
						<EmptyState
							onCreateFolder={() => setIsCreateDialogOpen(true)}
						/>
					) : reportId ? (
						<FolderView
							folder={currentFolder as Folder}
							reportId={reportId}
							files={filesByFolder}
							onBack={() => setCurrentFolderId(null)}
						/>
					) : (
						<FolderGrid
							folders={folders}
							onCreateFolder={() => setIsCreateDialogOpen(true)}
							onFolderClick={(folderId) => {
								navigate(`/reports/${folderId}`);
								setCurrentFolderId(folderId);
							}}
						/>
					)}
				</div>
			)}
			<CreateFolderDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onCreateFolder={handleCreateReportFolder}
			/>

			{/* Chat Summaries Section */}
			{/* <div>
				<h2 className="text-xl font-bold mb-4">Chat Summaries</h2>
				<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
					<Button
						key={chatSummaryFolder.id}
						variant="outline"
						className="h-32 w-full flex flex-col items-center justify-center gap-2"
						onClick={() => navigate("/chat-summaries")}
					>
						<FolderIcon className="h-8 w-8" />
						<span>{chatSummaryFolder.name}</span>
					</Button>
				</div>
			</div> */}
		</div>
	);
}

export default Reports;
