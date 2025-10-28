import { Hono } from "hono"; // Import Hono to build the API
import {
	deleteSummaryService,
	getSummariesByUserService,
	saveSummaryService,
} from "../services/summaryService"; // Import services

const app = new Hono();

// Controller to save a new summary
app.post("/summaries", async (c) => {
	const { userId, title, content } = await c.req.json();

	if (!userId || !title || !content) {
		return c.json({ error: "Missing required fields" }, 400); // Validate inputs
	}

	try {
		const result = await saveSummaryService(userId, title, content);
		return c.json(result, 201); // Return the created summary
	} catch (error) {
		return c.json({ error: (error as Error).message }, 500); // Handle errors
	}
});

// Controller to get all summaries for a user
app.get("/summaries/:userId", async (c) => {
	const { userId } = c.req.param();

	if (!userId) {
		return c.json({ error: "Missing userId parameter" }, 400);
	}

	try {
		const summaries = await getSummariesByUserService(userId);
		return c.json(summaries); // Return the user's summaries
	} catch (error) {
		return c.json({ error: (error as Error).message }, 500); // Handle errors
	}
});

// Controller to delete a summary by summaryId
app.delete("/summaries/:summaryId", async (c) => {
	const { summaryId } = c.req.param();

	if (!summaryId) {
		return c.json({ error: "Missing summaryId parameter" }, 400);
	}

	try {
		const result = await deleteSummaryService(summaryId);
		return c.json(result); // Return success message after deletion
	} catch (error) {
		return c.json({ error: (error as Error).message }, 500); // Handle errors
	}
});

export default app;
