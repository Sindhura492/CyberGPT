import toast from "react-hot-toast";

// Reusable functions for different toast types
export function showSuccessToast(message: string) {
	toast.success(message, {
		style: {
			background: "#4caf50", // Green for success
			color: "#fff",
		},
	});
}

export function showErrorToast(message: string) {
	toast.error(message, {
		style: {
			background: "#f44336", // Red for error
			color: "#fff",
		},
	});
}

export function showInfoToast(message: string) {
	toast(message, {
		style: {
			background: "#2196f3", // Blue for info
			color: "#fff",
		},
	});
}
export function showWarningToast(message: string) {
	toast(message, {
		icon: "⚠️", // Add an icon for warning
		style: {
			background: "#ff9800", // Orange for warning
			color: "#fff",
		},
	});
}
export function showLoadingToast(message: string) {
	return toast.loading(message, {
		style: {
			background: "#9e9e9e", // Gray for loading
			color: "#fff",
		},
	});
}
