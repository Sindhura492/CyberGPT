import bcrypt from "bcryptjs";
import { showSuccessToast } from "@components/toaster";
import { userApis } from "@api/profile-settings";
import useStore from "../../store/store";
import type { UseFormReturn } from "react-hook-form";

export type PasswordValues = {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
};
type PasswordVisibility = {
	currentPassword: boolean;
	newPassword: boolean;
	confirmPassword: boolean;
};

export const handleVisibilityToggle = (
	field: keyof PasswordVisibility,
	setPasswordVisibility: React.Dispatch<
		React.SetStateAction<PasswordVisibility>
	>,
) => {
	setPasswordVisibility((prevState) => ({
		...prevState,
		[field]: !prevState[field],
	}));
};

export const comparePasswords = async (
	enteredPassword: string,
	storedHash: string,
) => {
	return await bcrypt.compare(enteredPassword, storedHash);
};

export const handleSubmit = async (
	data: PasswordValues,
	form: UseFormReturn<PasswordValues>,
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	const { user, token } = useStore.getState();
	setIsLoading(true);

	if (user && token) {
		try {
			const payload = {
				oldPassword: data.currentPassword,
				newPassword: data.newPassword,
			};

			await userApis.changeUserPassword(user.id, payload, token);
			showSuccessToast("Password changed successfully!");
			form.reset({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch {
		} finally {
			setIsLoading(false);
		}
	}
};
