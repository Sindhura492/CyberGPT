import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface DialogProps {
	open: boolean; // Control dialog visibility externally
	onClose: () => void; // Callback to close the dialog
	title: string;
	description: string;
	onConfirm?: () => void;
	onCancel?: () => void;
	confirmText?: string;
	cancelText?: string;
}

export function Dialog({
	open,
	onClose,
	title,
	description,
	onConfirm,
	onCancel,
	confirmText = "Continue",
	cancelText = "Cancel",
}: DialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onClose}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm}>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
