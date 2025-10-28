import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

import { ConvexProvider } from "convex/react";

import convex from "./lib/convexClient.ts";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<ConvexProvider client={convex}>
			<App />
		</ConvexProvider>
	</StrictMode>,
);
