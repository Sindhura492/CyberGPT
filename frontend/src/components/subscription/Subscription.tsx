import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { showErrorToast, showSuccessToast } from "../toaster";
import useStore from "../../store/store";
import { BASE_URL } from "../../api/config.backend";

import { SUBSCRIPTION_PLANS } from "./constants";
import { useNavigate } from "react-router-dom";

export default function Subscription() {
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const { user, setUser } = useStore();
	const navigate = useNavigate();

	// Check if there's a session ID in the URL after Stripe redirects to the success URL
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const sessionId = urlParams.get("session_id");
		const plan = localStorage.getItem("plan_key");
		if (sessionId && plan) {
			if (user?.id) {
				handlePaymentSuccess(sessionId, Number.parseInt(user.id), plan);
			} else {
				showErrorToast("User ID is missing.");
			}
		}
	}, [user?.id]);

	const handleCheckout = async (planKey: string) => {
		setLoading(true);
		setMessage(""); // Reset message
		localStorage.setItem("plan_key", planKey);
		try {
			const response = await fetch(
				`${BASE_URL}/subscription/api/payment`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ plan: planKey }),
				},
			);

			const data = await response.json();
			if (data.url) {
				// Redirect to Stripe Checkout
				window.location.href = data.url;
			} else {
				showErrorToast("Unable to process payment. Please try again.");
			}
		} catch (error) {
			throw new Error(String(error));
		} finally {
			setLoading(false);
		}
	};

	// After successful payment, check the session status and redirect to chatbot
	const handlePaymentSuccess = async (
		sessionId: string,
		userId: number,
		plan: string,
	) => {
		try {
			const response = await fetch(
				`${BASE_URL}/subscription/api/payment/success?session_id=${sessionId}&user_id=${userId}&plan=${plan}`,
				{
					method: "GET",
				},
			);
			const data = await response.json();
			if (data.message) {
				setMessage(data.message);
				setUser(data.user);
				window.location.href = "/chatbot";
				showSuccessToast(data.message);
			} else {
				showErrorToast(data.error);
			}
		} catch (error) {
			throw new Error(String(error));
		}
	};

	return (
		<div className="container mx-auto px-8 py-16">
			<h1 className="text-4xl font-bold text-center mb-12">
				Choose Your Plan
			</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{SUBSCRIPTION_PLANS.map((plan, index) => (
					<Card
						// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						key={index}
						className={`flex flex-col ${index === 1 ? "md:scale-105" : ""} hover:shadow-lg transition-all duration-300`}
					>
						<CardHeader>
							<CardTitle className="text-2xl font-bold">
								{plan.name}
							</CardTitle>
							<CardDescription className="text-xl font-semibold">
								{plan.price}/month
							</CardDescription>
						</CardHeader>
						<CardContent className="flex-grow">
							<p className="text-muted-foreground mb-4">
								{plan.description}
							</p>
							<ul className="space-y-2">
								{plan.features.map((feature, featureIndex) => (
									<li
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										key={featureIndex}
										className="flex items-center"
									>
										<Check className="mr-2 h-4 w-4 text-green-500" />

										<span>{feature}</span>
									</li>
								))}
							</ul>
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								variant={index === 1 ? "default" : "outline"}
								onClick={() =>
									index === 1
										? handleCheckout(plan.planKey)
										: navigate("/chatbot")
								}
								disabled={loading}
							>
								{index && loading ? "Processing..." : plan.cta}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			{/* Show success message */}
			{message && (
				<div className="mt-4 text-center text-lg font-bold">
					{message}
				</div>
			)}
		</div>
	);
}
