import type { Context } from "hono";
import { ChatService } from "../services/chatService";

export class ScanController {
	private chatService!: ChatService;

	constructor() {
		this.init();
	}

	private async init() {
		this.chatService = await ChatService.getInstance();
	}

	async chat(c: Context) {
		try {
			const { scanResults } = await c.req.json();
			const response = await this.chatService.processScanSummary(scanResults);
			return c.json({ response });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ status: "error", message: errorMessage }, 500);
		}
	}

	async detailedSummary(c: Context) {
		try {
			const { scanResults } = await c.req.json();
			const response =
				await this.chatService.generateDetailedSummary(scanResults);
			return c.json({ response });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ status: "error", message: errorMessage }, 500);
		}
	}

	async detailedSastSummary(c: Context) {
		try {
			const { scanSastResults } = await c.req.json();
			const response =
				await this.chatService.generateDetailedSastSummary(scanSastResults);
			return c.json({ response });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ status: "error", message: errorMessage }, 500);
		}
	}

	async chatStream(c: Context) {
		try {
			const { scanResults } = await c.req.json();
			const stream = await this.chatService.processScanSummary(scanResults);

			return new Response(
				new ReadableStream({
					async start(controller) {
						for await (const chunk of stream) {
							const content = chunk.choices[0]?.delta?.content;
							if (content) {
								controller.enqueue(new TextEncoder().encode(content));
							}
						}
						controller.close();
					},
				}),
				{
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				},
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ status: "error", message: errorMessage }, 500);
		}
	}

	async chatSastStream(c: Context) {
		try {
			const { scanResults } = await c.req.json();
			const stream = await this.chatService.processSastScanSummary(scanResults);

			return new Response(
				new ReadableStream({
					async start(controller) {
						for await (const chunk of stream) {
							const content = chunk.choices[0]?.delta?.content;
							if (content) {
								controller.enqueue(new TextEncoder().encode(content));
							}
						}
						controller.close();
					},
				}),
				{
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-cache",
						Connection: "keep-alive",
					},
				},
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return c.json({ status: "error", message: errorMessage }, 500);
		}
	}
}
