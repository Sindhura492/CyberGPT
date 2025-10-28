import { BASE_URL } from "./config.backend";
import type {
  GraphGenerationRequest,
  GraphGenerationResponse,
  GraphData,
} from "../types/graphVisualization";

export const graphApis = {
  /**
   * Generate graph visualization for a chat message
   */
  generateGraph: async (
    request: GraphGenerationRequest
  ): Promise<GraphGenerationResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/graph/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate graph");
      }

      return await response.json();
    } catch (error) {throw error;
    }
  },

  /**
   * Get graph visualization by message ID
   */
  getGraphByMessageId: async (messageId: string, chatId: string): Promise<GraphData | null> => {
    try {
      const response = await fetch(`${BASE_URL}/graph/message/${messageId}?chatId=${chatId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get graph");
      }

      const data = await response.json();
      return data.graphData || null;
    } catch (error) {throw error;
    }
  },

  /**
   * Get all graphs for a chat
   */
  getGraphsByChatId: async (chatId: string): Promise<GraphData[]> => {
    try {
      const response = await fetch(`${BASE_URL}/graph/chat/${chatId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get graphs");
      }

      const data = await response.json();
      return data.graphs || [];
    } catch (error) {throw error;
    }
  },
};
