import { useToast } from "@hooks/use-toast";
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@components/ui/toast";

export function Toaster() {
	const { toasts } = useToast();

	return (
		<ToastProvider>
			{toasts.map(
				({
					id,
					title,
					description,
					action,
					...props
				}: {
					id: string;
					title?: string;
					description?: string;
					action?: React.ReactNode;
					[key: string]: unknown;
				}) => {
					return (
						<Toast key={id} {...props}>
							<div className="grid gap-1 relative">
								{title && <ToastTitle>{title}</ToastTitle>}
								{description && (
									<ToastDescription>
										{description}
									</ToastDescription>
								)}
							</div>
							{action}
							<ToastClose />
						</Toast>
					);
				},
			)}
			<ToastViewport />
		</ToastProvider>
	);
}
