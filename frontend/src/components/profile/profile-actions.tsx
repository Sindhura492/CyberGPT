import type { ProfileValues } from "./constants";
import { userApis } from "@api/profile-settings";
import { showErrorToast, showSuccessToast } from "@components/toaster";
import type { UpdateUserResponse } from "../../types/user";
import useStore from "../../store/store";

export const handleSubmit = async (
	data: ProfileValues,
	params: { userId: string },
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
	const token = useStore.getState().token;
	setIsLoading(true);
	try {
		const { userId } = params;
		const userData = {
			...data,
		};

		// Make API call to update user
		const response = await userApis.updateUserById(userId, userData, token);
		const result: UpdateUserResponse = response.data; // Extract the data
		useStore.getState().setUser(result);
		showSuccessToast("User details updated successfully!");
	} catch (error: unknown) {
		if (error instanceof Error) {
			showErrorToast(`An error occurred: ${error.message}`);
		} else {
			showErrorToast("An unknown error occurred.");
		}
	} finally {
		setIsLoading(false);
	}
};

export const handleDelete = async (params: { userId: string }) => {
	try {
		const { userId } = params;
		const token = useStore.getState().token;

		// Make API call to delete user
		await userApis.deleteUserByID(userId, token);
		setTimeout(() => {
			useStore.getState().logout();
			window.location.href = "/login";
		}, 2000);
		showSuccessToast("User Account Deleted Successfully!");
	} catch (error: unknown) {
		if (error instanceof Error) {
			showErrorToast(`An error occurred: ${error.message}`);
		} else {
			showErrorToast("An unknown error occurred.");
		}
	} finally {
	}
};
