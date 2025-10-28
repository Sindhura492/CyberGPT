import type { Context } from "hono";
import { PineconeService } from "../services/pineconeStore";
import { OpenAIService } from "../services/openai";
import { Document } from "langchain/document";
import type { CVEDocument } from "../types/cve";
interface QueryResponse {
	answer: string;
	context: Document[];
	metadata?: {
		totalDocs: number;
		searchScore?: number;
	};
}

export class RAGController {
	private pinecone: PineconeService | null = null;
	private openai = OpenAIService.getInstance();

	constructor() {
		this.init();
	}

	private async init() {
		this.pinecone = await PineconeService.getInstance();
		if (!this.pinecone) {
			console.warn("Pinecone not configured, RAG features will be limited");
		}
	}

	async loadDocuments(c: Context) {
		try {
			if (!this.pinecone) {
				return c.json({ error: "Pinecone not configured" }, 503);
			}
			
			const body = await c.req.json();
			const documents = body.documents.map(
				(doc: CVEDocument) =>
					new Document({
						pageContent: JSON.stringify(doc),
						metadata: { id: doc?.CVE_data_meta?.ID },
					}),
			);

			await this.pinecone.addDocuments(documents);
			return c.json({ status: "success", count: documents.length });
		} catch (error) {
			return c.json(
				{ status: "error", message: (error as Error).message },
				500,
			);
		}
	}

	async getDocuments(c: Context) {
		try {
			if (!this.pinecone) {
				return c.json({ error: "Pinecone not configured" }, 503);
			}
			
			const response = await this.pinecone.getLatestCVEs();
			const cveid = response.map((cve) => cve.metadata.id);

			return c.json({ status: "success", cve: cveid.slice(0, 5) });
		} catch (error) {
			return c.json(
				{ status: "error", message: (error as Error).message },
				500,
			);
		}
	}

	async query(c: Context) {
		try {
			console.log("[RAGController] --- Query method called ---");
			const { question } = await c.req.json();

			// Input validation
			if (!question || typeof question !== "string") {
				return c.json(
					{
						status: "error",
						message: "Invalid question format",
					},
					400,
				);
			}

		// Use LLM to extract canonical concept
		const canonicalConcept = await this.openai.getCanonicalConcept(question);
		console.log("[RAGController] User question:", question);
		console.log("[RAGController] Canonical concept from LLM:", canonicalConcept);

		if (!this.pinecone) {
			return c.json({ error: "Pinecone not configured" }, 503);
		}

		let docs: Document[] = await this.pinecone.similaritySearchBasedQuery(canonicalConcept);

			// Log available node names in the KG (if possible)
			let nodeNames: string[] = [];
			if (this.pinecone && typeof this.pinecone.listNodeNames === 'function') {
				nodeNames = await this.pinecone.listNodeNames();
				console.log("[RAGController] nodeNames fetched:", nodeNames);
			}

			// Fallback check logging
			console.log("[RAGController] Fallback check: canonicalConcept =", canonicalConcept, "| nodeNames =", nodeNames);
			nodeNames.forEach((name, idx) => {
				console.log(`[RAGController] Node ${idx + 1}: '${name}'`);
			});

			// Fallback: robust exact match on node names (case-insensitive, trimmed)
			if (
				docs.length === 0 &&
				nodeNames.some(name => name.trim().toLowerCase() === canonicalConcept.trim().toLowerCase())
			) {
				console.log("[RAGController] Using robust exact match fallback for:", canonicalConcept);
				const doc = await this.pinecone.getDocumentByConceptName(canonicalConcept);
				if (doc) docs = [doc];
			}

			// Handle no results case
			if (docs.length === 0) {
				console.log("[RAGController] No relevant data found for canonical concept:", canonicalConcept);
				return c.json({
					answer: "No information found for the given query.",
					context: [],
					metadata: { totalDocs: 0 },
				});
			}

			const answer = await this.openai.generateRagQueryAnswer(docs);

			const response: QueryResponse = {
				answer,
				context: docs,
				metadata: {
					totalDocs: docs.length,
				},
			};

			return c.json(response);
		} catch (error) {
			return c.json(
				{ status: "error", message: (error as Error).message },
				500,
			);
		}
	}
}

// Old graphRAGAnswerHandler and chatMessageStreamHandler removed - now using chatWithJargon endpoint instead

// Add a health check endpoint for debugging
export const healthCheckHandler = async (c: Context) => {
  try {
    // Test Neo4j connection
    const { driver } = await import('../config/neo4j');
    const session = driver.session();
    await session.run('RETURN 1 as test');
    await session.close();
    
    return c.json({ 
      status: 'healthy', 
      neo4j: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return c.json({ 
      status: 'unhealthy', 
      neo4j: 'disconnected',
      error: err?.toString(),
      timestamp: new Date().toISOString()
    }, 500);
  }
};
