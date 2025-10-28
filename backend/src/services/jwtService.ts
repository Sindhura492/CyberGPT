import * as jwt from "jsonwebtoken";
import type User from "../models/User";

export class JwtService {
	private readonly secret: string;

	constructor() {
		this.secret = process.env.JWT_SECRET || "your-secret-key";
	}

	generateToken(user: User): string {
		const payload = {
			id: user.id,
			email: user.email,
			authProvider: user.authProvider,
		};

		// Sign the JWT with payload and secret
		return jwt.sign(payload, this.secret, { expiresIn: "1d" });
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	verifyToken(token: string): any {
		return jwt.verify(token, this.secret);
	}
}
