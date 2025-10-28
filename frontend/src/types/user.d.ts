export interface User {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	avatar: string | null;
	username: string;
	authProvider: string;
	subscription?: string | null;
}

export type Password = {
	oldPassword: string;
	newPassword: string;
};

export type UserState = {
	user: User | null; // User could initially be null
	token: string | null;
	setUser: (user: User) => void;
	setToken: (token: string) => void;
	logout: () => void;
};

export interface UpdateUserResponse {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	email: string;
	authProvider: string;
}
