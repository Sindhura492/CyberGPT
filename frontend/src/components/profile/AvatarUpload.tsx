import type React from "react";
import { useState, useCallback } from "react";
import useStore from "../../store/store";
import { updateAvatar } from "../../api/profile-settings";
import type { User } from "../../types/user";
import { showErrorToast, showSuccessToast } from "../toaster";

interface AvatarUploadProps {
	userId: string;
	token: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, token }) => {
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const { user, setUser } = useStore();

	const onFileChange = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			try {
				const file = event.target.files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onloadend = () => {
					setPreviewUrl(reader.result as string);
				};
				reader.readAsDataURL(file);
				const response = await updateAvatar(userId, file, token);
				if (response?.data) {
					const updatedUser: User = response.data.user;
					setUser(updatedUser);
					setPreviewUrl(updatedUser.avatar || null);
					showSuccessToast("woah! You look awesome");
				} else {
					showErrorToast("phhhh... cannot update avatar");
				}
			} catch (error) {
				if (error instanceof Error) {
					throw new Error(
						`Failed to update avatar. Please try again. ${error.message}`,
					);
				}
			}
		},
		[userId, token, setUser],
	);

	const handlePreviewClick = useCallback(() => {
		document.getElementById("avatar-upload")?.click();
	}, []);

	return (
		<div className="avatar-upload-container">
			<input
				type="file"
				id="avatar-upload"
				accept="image/*"
				onChange={onFileChange}
				style={{ display: "none" }}
			/>
			<button
				type="button"
				className="avatar-preview transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
				onClick={handlePreviewClick}
				onKeyUp={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						handlePreviewClick();
					}
				}}
				style={{
					width: "120px",
					height: "120px",
					borderRadius: "50%",
					overflow: "hidden",
					cursor: "pointer",
					padding: 0,
					border: "none",
					background: "none",
					boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
				}}
			>
				{(previewUrl || user?.avatar) ? (
					<img
						src={previewUrl || user?.avatar || ""}
						alt="User Avatar"
						style={{
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
					/>
				) : (
					<div
						style={{
							width: "100%",
							height: "100%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: "var(--muted)",
							color: "var(--muted-foreground)",
							fontSize: "2rem",
							fontWeight: "bold",
						}}
					>
						{user?.firstName?.substring(0, 1) || "?"}
					</div>
				)}
			</button>
		</div>
	);
};

export default AvatarUpload;
