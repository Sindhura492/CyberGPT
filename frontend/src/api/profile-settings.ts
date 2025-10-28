import axiosInstance from "./axios";
import type { User, Password } from "../types/user";

const updateUserById = (id: string, payload: User, token: string) =>
	axiosInstance.put(`/users/user/edit/${id}`, payload, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

const getUserByID = (id: string, token: string) =>
	axiosInstance.get(`/users/user/${id}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

const changeUserPassword = async (
	id: string,
	payload: Password,
	token: string,
) => {
	return axiosInstance.put(`/users/user/change_password/${id}`, payload, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
};

const deleteUserByID = (id: string, token: string) =>
	axiosInstance.delete(`/users/user/delete/${id}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

export const updateAvatar = async (id: string, file: File, token: string) => {
	const formData = new FormData();
	formData.append("file", file);

	return axiosInstance.put(`/users/user/avatar/${id}`, formData, {
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "multipart/form-data",
		},
	});
};

export const userApis = {
	updateUserById,
	getUserByID,
	changeUserPassword,
	deleteUserByID,
	updateAvatar,
};
