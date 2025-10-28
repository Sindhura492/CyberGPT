export default interface User {
	id: number;
	email: string;
	username: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	password: string | null;
	authProvider: string;
	supabaseId: string | null;
	createdAt: Date;
	updatedAt: Date;
}
