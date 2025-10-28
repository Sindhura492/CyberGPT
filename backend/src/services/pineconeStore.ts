import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import type { Document } from "langchain/document";

export class PineconeService {
	private static instance: PineconeService | null = null;
	private store!: PineconeStore;
	private initialized: boolean = false;
	listNodeNames: any;

	private constructor() {
		// Don't initialize in constructor
	}

	private async initPinecone() {
		const pineconeApiKey = process.env.PINECONE_API_KEY;
		const pineconeIndex = process.env.PINECONE_INDEX;
		const openaiApiKey = process.env.OPENAI_API_KEY;

		if (!pineconeApiKey || !pineconeIndex || !openaiApiKey) {
			console.warn("Pinecone configuration missing. Pinecone features will be disabled.");
			this.initialized = false;
			return;
		}

		const pinecone = new Pinecone({
			apiKey: pineconeApiKey,
		});

		const embeddings = new OpenAIEmbeddings({
			openAIApiKey: openaiApiKey,
			modelName: "text-embedding-3-small",
		});

		const index = pinecone.Index(pineconeIndex);

		this.store = await PineconeStore.fromExistingIndex(embeddings, {
			pineconeIndex: index,
			namespace: "ns1",
		});
		
		this.initialized = true;
	}

	public static async getInstance(): Promise<PineconeService | null> {
		if (!PineconeService.instance) {
			PineconeService.instance = new PineconeService();
			await PineconeService.instance.initPinecone();
		}
		return PineconeService.instance.initialized ? PineconeService.instance : null;
	}

	async addDocuments(documents: Document[]): Promise<void> {
		if (!this.initialized) {
			throw new Error("Pinecone not configured");
		}
		await this.store.addDocuments(documents);
	}

	async similaritySearchBasedQuery(query: string, k = 5): Promise<Document[]> {
		if (!this.initialized) {
			throw new Error("Pinecone not configured");
		}
		return this.store.similaritySearch(query, k);
	}

	async similaritySearch(query: string, k = 5): Promise<Document[]> {
		if (!this.initialized) {
			throw new Error("Pinecone not configured");
		}
		const cveMatch = query.match(/CVE-\d{4}-\d+/i);

		if (cveMatch) {
			const cveId = cveMatch[0].toUpperCase();
			const filter = {
				metadata: {
					id: cveId,
				},
			};
			return this.store.similaritySearch(
				query.toUpperCase(),
				1,
				filter.metadata,
			);
		}
		const isListRequest =
			query.toLowerCase().includes("latest") ||
			query.toLowerCase().includes("list");
		if (isListRequest) {
			const results = await this.store.similaritySearch("", 100, {
				metadata: {},
			});

			const latestCves = results
				.filter((doc) => doc.metadata?.publishedDate)
				.sort(
					(a, b) =>
						new Date(b.metadata.publishedDate).getTime() -
						new Date(a.metadata.publishedDate).getTime(),
				)
				.slice(0, 10);

			return latestCves;
		}

		return this.store.similaritySearch(query, k);
	}

	async getLatestCVEs(): Promise<Document[]> {
		if (!this.initialized) {
			throw new Error("Pinecone not configured");
		}
		const results = await this.store.similaritySearch("", 100, {
			metadata: {},
		});

		const latestCves = results
			.filter((doc) => doc.metadata?.publishedDate)
			.sort(
				(a, b) =>
					new Date(b.metadata.publishedDate).getTime() -
					new Date(a.metadata.publishedDate).getTime(),
			)
			.slice(0, 10);

		return latestCves;
	}

	// // List all unique node names (concepts) in the store for debugging/logging
	// async listNodeNames(): Promise<string[]> {
	// 	if (typeof this.store.listNodeNames === 'function') {
	// 		return this.store.listNodeNames();
	// 	}
	// 	// If not supported, return empty array (or implement if possible)
	// 	return [];
	// }

	// Fetch a document by its canonical concept name (node name)
	async getDocumentByConceptName(conceptName: string): Promise<Document | null> {
		if (!this.initialized) {
			throw new Error("Pinecone not configured");
		}
		const results = await this.store.similaritySearch(conceptName, 100);
		console.log(`[PineconeService] Fallback search for concept: ${conceptName}`);
		results.forEach((doc, idx) => {
			console.log(`[PineconeService] Result ${idx + 1}: metadata.id=`, doc.metadata?.id, '| pageContent snippet=', doc.pageContent?.slice(0, 80));
		});
		return results.find(doc =>
			doc.metadata?.id === conceptName ||
			(doc.pageContent && doc.pageContent.includes(conceptName))
		) || null;
	}
}
