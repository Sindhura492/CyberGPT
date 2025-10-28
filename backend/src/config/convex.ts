import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convexClient = new ConvexHttpClient(process.env.CONVEX_URL || "");
export { convexClient, api };
