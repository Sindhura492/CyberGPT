import { Hono } from "hono";
import {
	stripePayment,
	stripePaymentSuccess,
} from "../controllers/paymentController";

const paymentRoutes = new Hono();

paymentRoutes.post("/api/payment", stripePayment);
paymentRoutes.get("/api/payment/success", stripePaymentSuccess);

export { paymentRoutes };
