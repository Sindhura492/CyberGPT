import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL environment variable is required");
}

const convex = new ConvexReactClient(convexUrl);

export default convex;
