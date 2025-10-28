import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from "../ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import type { RequestHumanInLoop } from "../../types/chats";

interface CreateFolderDialogProps {
	open: boolean;
	humanInTheLoopAction?: RequestHumanInLoop | null | undefined;
	onOpenChange: (open: boolean) => void;
	onCreateFolder: (name: string, action?: RequestHumanInLoop) => void;
}

export function CreateFolderDialog({
	open,
	humanInTheLoopAction,
	onOpenChange,
	onCreateFolder,
}: CreateFolderDialogProps) {
	const [folderName, setFolderName] = useState("");
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (humanInTheLoopAction) {
			onCreateFolder(folderName, humanInTheLoopAction);
		} else {
			onCreateFolder(folderName);
		}
		setFolderName("");
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Folder</DialogTitle>
					<DialogDescription className="sr-only">
						Enter a name for your new folder
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="folderName">Folder Name</Label>
							<Input
								id="folderName"
								value={folderName}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) => setFolderName(e.target.value)}
								placeholder="Enter folder name"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={!folderName}>
							Create Folder
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
