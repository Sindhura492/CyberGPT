import { XIcon } from "lucide-react";
import { Button } from "../ui/button";
import useChatActionStore from "../../store/chatActions";

interface HumanInTheLoopProps {
	onConfirm: (confirmType: string) => void;
	onCancel: () => void;
	message?: string;
	confirmType: string;
	addBotMessage: (message: string) => void;
}

const HumanInTheLoopApproval: React.FC<HumanInTheLoopProps> = ({
	onConfirm,
	onCancel,
	message,
	confirmType,
	addBotMessage,
}) => {
	const { setPendingAction } = useChatActionStore();
	return (
		<div className="relative flex flex-col mt-4 p-4 bg-sidebar-accent/20 border-l-4 border-sidebar-primary mb-4 rounded-lg rounded-l-none">
			<XIcon
				onClick={() => {
					setPendingAction(null);
					addBotMessage("Action cancelled?");
				}}
				className="h-5 w-5 cursor-pointer absolute top-2 right-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
			/>
			<p className="text-sidebar-foreground mr-2 mb-4">{message}</p>
			<div className="flex space-x-4">
				<Button
					size="lg"
					className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
					onClick={() => {
						onConfirm(confirmType);
					}}
				>
					Yes
				</Button>
				<Button
					size="lg"
					className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					type="button"
					onClick={onCancel}
				>
					No
				</Button>
			</div>
		</div>
	);
};

export { HumanInTheLoopApproval };
