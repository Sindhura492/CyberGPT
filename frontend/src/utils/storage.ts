export function getUserTokenFromSessionStorage(): string | null {
	return sessionStorage.getItem("accessToken"); // Replace with your token key
}

export function setUserTokenToSessionStorage(token: string): void {
	sessionStorage.setItem("accessToken", token);
}

export function removeUserTokenFromSessionStorage(): void {
	sessionStorage.removeItem("accessToken");
}
