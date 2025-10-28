import type { PrismaClient, Subscription } from "@prisma/client";
import Stripe from "stripe";

// Only initialize Stripe if secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey 
	? new Stripe(stripeSecretKey, {
			apiVersion: "2025-01-27.acacia",
		})
	: null;

type PlanType = "free" | "intermediate" | "pro";

const prices = {
	free: process.env.STRIPE_FREE_PRICE_ID || "",
	intermediate: process.env.STRIPE_INTERMEDIATE_PRICE_ID || "",
	pro: process.env.STRIPE_PRO_PRICE_ID || "",
};

export class StripeService {
	private prisma: PrismaClient;

	constructor(prisma: PrismaClient) {
		this.prisma = prisma;
	}
	async createCheckoutSession(plan: PlanType) {
		if (!stripe) {
			throw new Error("Stripe not configured");
		}
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					price: prices[plan],
					quantity: 1,
				},
			],
			mode: "subscription",
			success_url: `${process.env.CLIENT_REDIRECT_URL}/subscription?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_REDIRECT_URL}/subscription`,
		});
		return session.url;
	}

	async verifyPayment(session_id: string, userId: string, plan: string) {
		if (!stripe) {
			throw new Error("Stripe not configured");
		}
		if (!session_id) {
			throw new Error("Session ID is missing");
		}

		const validPlans: string[] = ["FREE", "INTERMEDIATE", "PRO"];

		// Convert the plan value to uppercase to ensure it matches the expected enum values
		const upperCasePlan = plan.toUpperCase();

		if (!validPlans.includes(upperCasePlan as Subscription)) {
			throw new Error("Invalid subscription plan provided");
		}

		try {
			// Update subscription if valid
			const user = await this.prisma.user.update({
				where: {
					id: Number.parseInt(userId),
				},
				data: {
					subscription: upperCasePlan as Subscription,
				},
			});

			const session = await stripe.checkout.sessions.retrieve(session_id);

			if (session.payment_status === "paid") {
				return {
					message: "Payment successful and subscription updated",
					user,
				};
			}
			throw new Error("Payment failed. Please try again.");
		} catch (error) {
			console.error("Error verifying payment:", error);
			throw new Error("An error occurred. Please try again later.");
		}
	}
}
