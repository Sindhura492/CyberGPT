import { Context } from "hono";
import { GraphGenerationService } from "../services/graphGenerationService";
import { convexClient, api } from "../config/convex";
import type {
  GraphGenerationRequest,
  GraphGenerationResponse,
} from "../types/graphVisualization";

export class GraphController {
  private graphService = GraphGenerationService.getInstance();

  /**
   * Generate graph visualization for a chat message
   */
  async generateGraph(c: Context) {
    try {
      console.log("[GraphController] Generating graph visualization");

      const body: GraphGenerationRequest = await c.req.json();

      // Validate required fields
      if (!body.messageId || !body.chatId || !body.question || !body.answer) {
        return c.json(
          {
            success: false,
            error:
              "Missing required fields: messageId, chatId, question, answer",
          } as GraphGenerationResponse,
          400
        );
      }

      // Generate graph data
      const graphData = await this.graphService.generateGraphFromMessage(
        body.messageId,
        body.chatId,
        body.question,
        body.answer,
        body.reasoning,
        body.sources,
        body.jargons,
        body.cveInfo
      );

      console.log("[GraphController] Graph generated successfully");

      return c.json({
        success: true,
        graphData,
      } as GraphGenerationResponse);
    } catch (error) {
      console.error("[GraphController] Error generating graph:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as GraphGenerationResponse,
        500
      );
    }
  }

  /**
   * Test endpoint to generate sample graph data
   */
  async generateTestGraph(c: Context) {
    try {
      console.log("[GraphController] Generating test graph");

      const graphData = await this.graphService.generateSampleGraph();

      console.log("[GraphController] Test graph generated successfully");

      return c.json({
        success: true,
        graphData,
      } as GraphGenerationResponse);
    } catch (error) {
      console.error("[GraphController] Error generating test graph:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as GraphGenerationResponse,
        500
      );
    }
  }

  /**
   * Test endpoint to generate a real graph with sample data
   */
  async generateTestRealGraph(c: Context) {
    try {
      console.log("[GraphController] Generating test real graph");

      const graphData = await this.graphService.generateGraphFromMessage(
        "test_msg_001",
        "test_chat_001",
        "What are the risks of SQL injection?",
        "SQL injection is a critical vulnerability that allows attackers to manipulate database queries. It can lead to data breaches, unauthorized access, and system compromise. Common mitigation strategies include input validation, parameterized queries, and proper authentication.",
        "Based on OWASP Top 10 analysis and security best practices",
        ["OWASP Top 10", "NVD Database"],
        {
          SQL: "Structured Query Language",
          XSS: "Cross-Site Scripting",
        },
        {
          cve_id: "CVE-2023-1234",
          cve_desc: "SQL injection vulnerability",
          mitigation: "Input validation",
        }
      );

      console.log("[GraphController] Test real graph generated successfully");

      return c.json({
        success: true,
        graphData,
      } as GraphGenerationResponse);
    } catch (error) {
      console.error(
        "[GraphController] Error generating test real graph:",
        error
      );
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as GraphGenerationResponse,
        500
      );
    }
  }

  /**
   * Test endpoint to verify user question as main problem node
   */
  async generateTestUserQuestionGraph(c: Context) {
    try {
      console.log(
        "[GraphController] Generating test graph with user question as main problem"
      );

      const graphData = await this.graphService.generateGraphFromMessage(
        "test_user_question_001",
        "test_chat_002",
        "How can I protect my web application from XSS attacks?",
        "Cross-Site Scripting (XSS) attacks can be prevented through several security measures. Input validation and output encoding are crucial. Content Security Policy (CSP) headers help prevent script injection. Regular security audits and keeping frameworks updated are also important. OWASP provides comprehensive guidelines for XSS prevention.",
        "Based on OWASP XSS prevention guidelines and web security best practices",
        ["OWASP XSS Prevention", "Web Security Guidelines"],
        {
          XSS: "Cross-Site Scripting",
          CSP: "Content Security Policy",
          OWASP: "Open Web Application Security Project",
        },
        {
          cve_id: "CVE-2023-5678",
          cve_desc: "XSS vulnerability in web application",
          mitigation: "Input validation and output encoding",
        }
      );

      console.log(
        "[GraphController] Test user question graph generated successfully"
      );
      console.log("Graph Summary:", {
        totalNodes: graphData.nodes.length,
        mainProblemNode: graphData.nodes.find(
          (n: any) => n.id === "main-problem"
        ),
        problemConnections: graphData.links.filter(
          (l: any) => l.source === "main-problem" || l.target === "main-problem"
        ).length,
      });

      return c.json({
        success: true,
        graphData,
        summary: {
          totalNodes: graphData.nodes.length,
          totalLinks: graphData.links.length,
          mainProblemNode: graphData.nodes.find((n) => n.id === "main-problem"),
          problemConnections: graphData.links.filter(
            (l) => l.source === "main-problem" || l.target === "main-problem"
          ).length,
        },
      } as GraphGenerationResponse);
    } catch (error) {
      console.error(
        "[GraphController] Error generating test user question graph:",
        error
      );
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        } as GraphGenerationResponse,
        500
      );
    }
  }

  /**
   * Get graph visualization by message ID
   */
  async getGraphByMessageId(c: Context) {
    try {
      const { messageId } = c.req.param();

      if (!messageId) {
        return c.json(
          {
            success: false,
            error: "Message ID is required",
          },
          400
        );
      }

      // Get chatId from query parameters
      const chatId = c.req.query("chatId");

      if (!chatId || chatId === "undefined") {
        return c.json(
          {
            success: false,
            error: "Valid Chat ID is required",
          },
          400
        );
      }

      console.log(
        `🔍 [GraphController] Getting graph for messageId: ${messageId}, chatId: ${chatId}`
      );

      // Query Convex database for the graph visualization
      console.log(
        `🔄 [GraphController] Querying Convex with messageId: ${messageId}, chatId: ${chatId}`
      );

      const graphVisualization = await convexClient.query(
        api.graphVisualizations.getGraphByMessageId,
        {
          messageId,
          chatId: chatId as any, // Cast to Convex ID type
        }
      );

      console.log(`📊 [GraphController] Convex query result:`, {
        hasGraphData: !!graphVisualization,
        graphDataKeys: graphVisualization ? Object.keys(graphVisualization) : 'No graph data',
        graphDataType: typeof graphVisualization,
        messageId,
        chatId
      });

      if (!graphVisualization) {
        console.log(
          `[GraphController] No graph found for messageId: ${messageId}, chatId: ${chatId}`
        );
        return c.json(
          {
            success: false,
            error:
              "Graph not found for this message. Try generating a graph first.",
          },
          404
        );
      }

      console.log("[GraphController] Graph found successfully");

      return c.json({
        success: true,
        graphData: graphVisualization,
      });
    } catch (error) {
      console.error("[GraphController] Error getting graph:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        500
      );
    }
  }

  /**
   * Get all graphs for a chat
   */
  async getGraphsByChatId(c: Context) {
    try {
      const { chatId } = c.req.param();

      if (!chatId) {
        return c.json(
          {
            success: false,
            error: "Chat ID is required",
          },
          400
        );
      }

      // This would typically query the database for all graphs in a chat
      // For now, we'll return a placeholder response
      return c.json({
        success: true,
        graphs: [],
      });
    } catch (error) {
      console.error("[GraphController] Error getting graphs:", error);
      return c.json(
        {
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        500
      );
    }
  }
}
