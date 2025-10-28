import { getUserTokenFromSessionStorage } from "../utils/storage";

import { showErrorToast } from "@components/toaster";
//types
import axios, {
	type InternalAxiosRequestConfig,
	type AxiosResponse,
	type AxiosRequestHeaders,
} from "axios";
import { BASE_URL } from "./config.backend";

// Creating an Axios instance
const axiosInstance = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
	(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
		// Add Authorization header if token is available
		const accessToken = getUserTokenFromSessionStorage();
		if (accessToken) {
			if (!config.headers) {
				config.headers = {} as AxiosRequestHeaders; // Explicitly cast as AxiosRequestHeaders
			}
			config.headers.Authorization = `Bearer ${accessToken}`;
		}
		return config;
	},
	(error) => {
		// Handle request errors
		return Promise.reject(error);
	},
);

// Response interceptor
axiosInstance.interceptors.response.use(
	(response: AxiosResponse) => {
		return response;
	},
	(error) => {
		if (error.response) {
			const { status, data } = error.response;
			const { error: errorMessage, message } = data;

			switch (status) {
				case 403:
					if (errorMessage === "invalid_token") {
						showErrorToast(errorMessage);
						localStorage.clear();
						setTimeout(() => window.location.replace("/"), 1000);
					}
					break;

				case 401:
					if (message === "Invalid token.") {
						showErrorToast("Token Expired. Please login again");
						localStorage.clear();
						setTimeout(
							() => window.location.replace("/login"),
							1000,
						);
					} else {
						showErrorToast(errorMessage);
					}
					break;

				case 404:
					// Handle Not Found
					showErrorToast(errorMessage || "Not Found");
					break;

				case 400:
					// Handle Bad Request
					showErrorToast(errorMessage || "Bad Request");
					break;

				case 500:
					// Handle Server Error
					showErrorToast("Internal Server Error");
					break;

				default:
					// Handle other errors
					showErrorToast(errorMessage || "An error occurred");
					break;
			}
		} else {
			// Handle network or unexpected errors
			showErrorToast("Network error. Please try again later.");
		}

		return Promise.reject(error);
	},
);

export default axiosInstance;
