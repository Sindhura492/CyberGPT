import type { FC } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@components/ui/dialog";

interface InfoPopupProps {
	isOpen: boolean;
	onClose: () => void;
}

export const InfoPopup: FC<InfoPopupProps> = ({ isOpen, onClose }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Human Intervention Required</DialogTitle>
					<DialogDescription>
						Our AI system has determined that this conversation
						requires human expertise. A human agent will join the
						conversation shortly to assist you. Please be patient as
						we connect you with one of our team members.
					</DialogDescription>
				</DialogHeader>
				<div className="flex justify-end">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
					>
						Close
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
