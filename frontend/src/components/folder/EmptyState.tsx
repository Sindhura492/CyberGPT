import { Folder } from "lucide-react";
import { Button } from "@components/ui/button";

interface EmptyStateProps {
	onCreateFolder: () => void;
}

export function EmptyState({ onCreateFolder }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
			<div className="p-4 rounded-full bg-muted">
				<Folder className="w-8 h-8 text-muted-foreground" />
			</div>
			<h3 className="text-xl font-semibold">No Folders Created</h3>
			<p className="text-sm text-muted-foreground">
				Start creating a new folder to organize your space.
			</p>
			<Button onClick={onCreateFolder}>Create Folder</Button>
		</div>
	);
}
