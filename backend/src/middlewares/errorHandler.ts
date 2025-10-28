import type { Context, Next } from "hono";

export const errorHandler = async (c: Context, next: Next) => {
	try {
		await next();
	} catch (err) {
		if (err instanceof Error) {
			return c.json(
				{
					error: {
						message: err.message,
						stack:
							process.env.NODE_ENV === "production"
								? "🥞"
								: err.stack,
					},
				},
				500,
			);
		}

		return c.json(
			{
				error: {
					message: "An unexpected error occurred",
					stack:
						process.env.NODE_ENV === "production"
							? "🥞"
							: "Unknown stack",
				},
			},
			500,
		);
	}
};
