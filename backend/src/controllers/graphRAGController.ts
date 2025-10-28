import type { Context } from "hono";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import driver from "../config/neo4j";

// ✅ Move outside to avoid strict-mode issue
function parseGraphTraversalToGraphData(cveId: string, risk: string, mitigation: string | null) {
  return {
    nodes: [
      { id: "Vulnerability", label: "Vulnerability" },
      { id: cveId, label: cveId },
      { id: "Risk", label: `Risk: ${risk || "Unknown"}` },
      { id: "Mitigation", label: `Mitigation: ${mitigation || "Not Provided"}` }
    ],
    links: [
      { source: "Vulnerability", target: cveId, label: "has_identifier" },
      { source: cveId, target: "Risk", label: "has_severity" },
      { source: cveId, target: "Mitigation", label: "has_mitigation" }
    ]
  };
}

export class GraphRAGController {
  async query(c: Context) {
    try {
      const { question } = await c.req.json();

      if (!question || typeof question !== "string") {
        return c.json({ status: "error", message: "Invalid question format" }, 400);
      }

      // Step 1: Initialize LLM
      const llm = new ChatOpenAI({
        modelName: "gpt-4",
        openAIApiKey: process.env.OPENAI_API_KEY!,
        temperature: 0.3,
      });

      // Step 2: Generate Cypher query
      const cypherPrompt = new PromptTemplate({
        inputVariables: ["input"],
        template: `
You are a Cypher query expert working with a Neo4j cybersecurity knowledge graph.

The graph contains:
- Vulnerability nodes with "cve_id"
- Severity nodes with "level"
- Mitigation, Risk, Source nodes
- Relationships: 
    (Vulnerability)-[:HAS_BASE_SEVERITY]->(Severity)
    (Vulnerability)-[:HAS_MITIGATION]->(Mitigation)
    (Vulnerability)-[:CAUSES]->(Risk)
    (Vulnerability)-[:HAS_SOURCE]->(Source)

Given the user question below, generate an appropriate Cypher query.

Question: {input}

Only return the Cypher query.
        `,
      });

      const cypherQuery = await cypherPrompt.format({ input: question });
      const cypherResponse = await llm.invoke(cypherQuery);
      const cypher = cypherResponse?.content?.trim();

      if (!cypher?.toLowerCase().startsWith("match")) {
        return c.json({
          status: "error",
          message: "❌ GPT-4 did not return a valid Cypher query.",
          cypher,
        });
      }

      // Step 3: Run Cypher on Neo4j
      const session = driver.session();
      const result = await session.run(cypher);
      const records = result.records.map((r) => r.toObject());
      const answer = records.map((r) => Object.values(r)[0]);
      await session.close();

      // Step 4: Ask LLM for Explanation, Graph, Sources
      const explanationPrompt = new PromptTemplate({
        inputVariables: ["input", "data"],
        template: `
You're an AI assistant. Based on the following question and its database result, return:

1. 🔍 Reasoning: Explain why this answer is relevant.
2. 📘 Sources: Mention any relevant references or typical cybersecurity sources.
3. 🌐 Graph Traversal: Explain the link: Vulnerability → CVE → Risk → Mitigation.

Format JSON like:
{{
  "title": "...",
  "reasoning": "...",
  "answer": "...",
  "sources": ["..."],
  "graphTraversal": "..."
}}

Question: {input}
Data: {data}
        `
      });

      const explanationText = await explanationPrompt.format({
        input: question,
        data: JSON.stringify(answer),
      });

      const finalResponse = await llm.invoke(explanationText);

      let parsed;
      try {
        parsed = JSON.parse(finalResponse.content);
      } catch (err) {
        return c.json({
          status: "error",
          message: "❌ Failed to parse explanation JSON.",
          raw: finalResponse.content,
        }, 500);
      }

      // Step 5: Generate ONE tag
      const tagPrompt = new PromptTemplate({
        inputVariables: ["input"],
        template: `
You are a chatbot assistant. For the following cybersecurity-related question, generate exactly one unique and specific tag.

- The tag should summarize the main topic (e.g., #severityLevel, #cveInsight, #mitigationStep).
- Use kebab-case or camelCase.
- Prefix with '#'.
- Return as plain JSON string (like: "#cveInsight").

Question: {input}
        `
      });

      const tagQuery = await tagPrompt.format({ input: question });
      const tagResponse = await llm.invoke(tagQuery);

      let tag: string = "#generalQuery";
      try {
        tag = JSON.parse(tagResponse.content);
      } catch (err) {
        console.warn("⚠️ Failed to parse tag. Using fallback.");
      }

      // Step 6: Prepare graphData for D3.js
      const cveId = "CVE-2025-6089"; // or extract from question
      const riskLevel = parsed.answer.includes("MEDIUM") ? "MEDIUM" : "Unknown";
      const mitigationInfo = parsed.answer.includes("Mitigation") ? "Mitigation Provided" : null;

      const graphData = parseGraphTraversalToGraphData(cveId, riskLevel, mitigationInfo);

      // ✅ Final response
      return c.json({
        status: "success",
        tag,
        answer: {
          title: parsed.title,
          reasoning: parsed.reasoning,
          content: parsed.answer,
          sources: parsed.sources,
          graphExplanation: parsed.graphTraversal
        },
        graphData, // 🎯 For D3.js frontend
        metadata: {
          timestamp: new Date().toISOString(),
          cypher,
          raw: records,
        }
      });

    } catch (err) {
      console.error("❌ GraphRAG Error:", err);
      return c.json(
        { status: "error", message: (err as Error).message },
        500
      );
    }
  }
}
