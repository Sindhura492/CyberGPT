import type { Context } from "hono";
import { StripeService } from "../services/stripeService";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stripeService = new StripeService(prisma);

export const stripePayment = async (c: Context) => {
	try {
		const { plan } = await c.req.json();
		if (!["free", "intermediate", "pro"].includes(plan)) {
			return c.json({ error: "Invalid plan" }, 400);
		}

		const checkoutUrl = await stripeService.createCheckoutSession(plan);
		return c.json({ url: checkoutUrl });
	} catch (error) {
		console.error(error);
		return c.json({ error: "Unable to create payment session" }, 500);
	}
};

export const stripePaymentSuccess = async (c: Context) => {
	const session_id = c.req.query("session_id");
	const user_id = c.req.query("user_id");
	const plan = c.req.query("plan");
	if (!session_id || !user_id) {
		return c.json({ error: "Session ID or User is missing" }, 400);
	}

	try {
		const result = await stripeService.verifyPayment(
			session_id as string,
			user_id as string,
			plan as string,
		);
		return c.json(result);
	} catch (error) {
		console.error(error);
		return c.json({ error: (error as Error).message }, 500);
	}
};
