import { GraphGenerationService } from "./graphGenerationService";
import { convexClient, api } from "../config/convex";

export interface ChatMessageData {
  messageId: string;
  chatId: string;
  question: string;
  answer: string;
  reasoningTrace?: any;
  jargons?: { term: string; description: string }[];
  cveDescriptionsMap?: Record<string, string>;
  sourceLinks?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  contextData?: {
    cveIds: string[];
    cveDescriptions: string[];
    riskLevels: string[];
    mitigations: string[];
    concept: string;
  };
}

export class ChatGraphIntegrationService {
  private static instance: ChatGraphIntegrationService;
  private graphService = GraphGenerationService.getInstance();

  private constructor() {}

  public static getInstance(): ChatGraphIntegrationService {
    if (!ChatGraphIntegrationService.instance) {
      ChatGraphIntegrationService.instance = new ChatGraphIntegrationService();
    }
    return ChatGraphIntegrationService.instance;
  }

  /**
   * Process chat message and automatically generate graph visualization
   */
  async processChatMessageWithGraph(data: ChatMessageData): Promise<{
    success: boolean;
    graphData?: any;
    error?: string;
  }> {
    try {
      console.log(
        "🔄 [ChatGraphIntegrationService] Processing chat message with graph generation:",
        {
          messageId: data.messageId,
          chatId: data.chatId,
          questionLength: data.question.length,
          answerLength: data.answer.length,
          hasReasoningTrace: !!data.reasoningTrace,
          hasJargons: !!data.jargons,
          hasCveDescriptionsMap: !!data.cveDescriptionsMap,
          hasSourceLinks: !!data.sourceLinks,
          hasContextData: !!data.contextData,
        }
      );

      // Generate graph visualization
      const graphData = await this.graphService.generateGraphFromMessage(
        data.messageId,
        data.chatId,
        data.question,
        data.answer,
        data.reasoningTrace ? JSON.stringify(data.reasoningTrace) : undefined,
        data.sourceLinks?.map((link) => link.title) || [],
        data.jargons?.reduce(
          (acc, jargon) => {
            acc[jargon.term] = jargon.description;
            return acc;
          },
          {} as Record<string, string>
        ) || {},
        data.cveDescriptionsMap
          ? {
              cve_id: Object.keys(data.cveDescriptionsMap)[0],
              cve_desc: Object.values(data.cveDescriptionsMap)[0],
              mitigation: undefined,
            }
          : undefined
      );

      // Convert GraphData to graphVisualization format for storage
      console.log(
        "🔄 [ChatGraphIntegration] Converting graph data for database storage..."
      );
      const graphVisualization =
        this.convertGraphDataToGraphVisualization(graphData);

      console.log(
        "📊 [ChatGraphIntegration] Converted graph visualization structure:",
        {
          messageId: data.messageId,
          vulnerabilities: graphVisualization.vulnerabilities?.length || 0,
          mitigations: graphVisualization.mitigations?.length || 0,
          sources: graphVisualization.sources?.length || 0,
          cves: graphVisualization.cves?.length || 0,
          problems: graphVisualization.problems?.length || 0,
          affected: graphVisualization.affected?.length || 0,
          risks: graphVisualization.risks?.length || 0,
          relationships: graphVisualization.relationships?.length || 0,
        }
      );

      // Note: Graph visualization will be saved by the frontend along with chat history
      console.log(
        "📊 [ChatGraphIntegration] Graph visualization generated successfully, will be saved by frontend"
      );

      console.log(
        "✅ [ChatGraphIntegrationService] Graph generated and saved successfully:",
        {
          messageId: data.messageId,
          nodes: graphData.nodes.length,
          links: graphData.links.length,
          hasGraphData: !!graphData,
          graphDataKeys: graphData ? Object.keys(graphData) : "No graph data",
        }
      );

      return {
        success: true,
        graphData,
      };
    } catch (error) {
      console.error(
        "❌ [ChatGraphIntegrationService] Error processing chat message with graph:",
        error
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Convert GraphData to graphVisualization format for Convex storage
   */
  private convertGraphDataToGraphVisualization(graphData: any): any {
    const graphVisualization: any = {};

    // Convert nodes to graphVisualization format
    graphData.nodes.forEach((node: any) => {
      switch (node.type) {
        case "vulnerability":
          if (!graphVisualization.vulnerabilities)
            graphVisualization.vulnerabilities = [];
          graphVisualization.vulnerabilities.push({
            id: node.id,
            name: node.label,
            description: node.description,
            severity: node.severity,
            cvss: node.cvss,
            source: node.source,
          });
          break;
        case "mitigation":
          if (!graphVisualization.mitigations)
            graphVisualization.mitigations = [];
          graphVisualization.mitigations.push({
            id: node.id,
            name: node.label,
            description: node.description,
            type: node.metadata?.originalEntity?.type,
            effectiveness: node.metadata?.originalEntity?.effectiveness,
            source: node.source,
          });
          break;
        case "source":
          if (!graphVisualization.sources) graphVisualization.sources = [];
          graphVisualization.sources.push({
            id: node.id,
            name: node.label,
            description: node.description,
            type: node.metadata?.originalEntity?.type,
            url: node.metadata?.originalEntity?.url,
            reliability: node.metadata?.originalEntity?.reliability,
            source: node.source,
          });
          break;
        case "cve":
          if (!graphVisualization.cves) graphVisualization.cves = [];
          graphVisualization.cves.push({
            id: node.id,
            cveId: node.label,
            description: node.description,
            severity: node.severity,
            cvss: node.cvss,
            source: node.source,
          });
          break;
        case "problem":
          if (!graphVisualization.problems) graphVisualization.problems = [];
          graphVisualization.problems.push({
            id: node.id,
            name: node.label,
            description: node.description,
            category: node.metadata?.originalEntity?.category,
            impact: node.metadata?.originalEntity?.impact,
            source: node.source,
          });
          break;
        case "affected":
          if (!graphVisualization.affected) graphVisualization.affected = [];
          graphVisualization.affected.push({
            id: node.id,
            name: node.label,
            description: node.description,
            type: node.metadata?.originalEntity?.type,
            impact: node.metadata?.originalEntity?.impact,
            source: node.source,
          });
          break;
        case "risk":
          if (!graphVisualization.risks) graphVisualization.risks = [];
          graphVisualization.risks.push({
            id: node.id,
            name: node.label,
            description: node.description,
            level: node.severity,
            probability: node.metadata?.originalEntity?.probability,
            impact: node.metadata?.originalEntity?.impact,
            source: node.source,
          });
          break;
      }
    });

    // Convert links to relationships
    if (graphData.links && graphData.links.length > 0) {
      graphVisualization.relationships = graphData.links.map((link: any) => ({
        id: link.id,
        sourceId: link.source,
        targetId: link.target,
        type: link.type,
        strength: link.strength,
        description: link.description,
      }));
    }

    return graphVisualization;
  }

  /**
   * Get graph visualization for a specific message
   */
  async getGraphForMessage(messageId: string, chatId: string): Promise<any> {
    try {
      const graphVisualization = await convexClient.query(
        api.graphVisualizations.getGraphByMessageId,
        {
          messageId,
          chatId: chatId as any,
        }
      );

      return graphVisualization;
    } catch (error) {
      console.error(
        "[ChatGraphIntegrationService] Error getting graph for message:",
        error
      );
      return null;
    }
  }

  /**
   * Get all graphs for a chat
   */
  async getGraphsForChat(chatId: string): Promise<any[]> {
    try {
      const graphs = await convexClient.query(
        api.graphVisualizations.getGraphsByChatId,
        {
          chatId: chatId as any,
        }
      );

      return graphs;
    } catch (error) {
      console.error(
        "[ChatGraphIntegrationService] Error getting graphs for chat:",
        error
      );
      return [];
    }
  }

  /**
   * Get graph data for a specific message
   */
  async getGraphData(messageId: string, chatId: string): Promise<any | null> {
    try {
      console.log("🔍 [ChatGraphIntegrationService] Getting graph data for:", {
        messageId,
        chatId,
      });

      // Query Convex for the graph visualization data
      const graphVisualization = await convexClient.query(
        api.graphVisualizations.getByMessageId,
        { messageId }
      );

      if (graphVisualization) {
        console.log("✅ [ChatGraphIntegrationService] Graph data found:", {
          messageId,
          hasGraphData: !!graphVisualization.graphData,
          nodes: graphVisualization.graphData?.nodes?.length || 0,
          links: graphVisualization.graphData?.links?.length || 0,
        });
        return graphVisualization.graphData;
      } else {
        console.log(
          "⏳ [ChatGraphIntegrationService] No graph data found yet:",
          {
            messageId,
            chatId,
          }
        );
        return null;
      }
    } catch (error) {
      console.error(
        "❌ [ChatGraphIntegrationService] Error getting graph data:",
        error
      );
      return null;
    }
  }
}
