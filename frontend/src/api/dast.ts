import axios from "axios";
import { getBackendUrl } from "./config.backend";
import type { DASTScanRequest, DASTScanResponse } from "../types/dastScan";

const dastApi = {
  async scanUrl(request: DASTScanRequest): Promise<DASTScanResponse> {
    try {const response = await axios.post(
        `${getBackendUrl()}/dast/scan`,
        { url: request.url },
        {
          timeout: 60000, // 60 second timeout for DAST scans
          headers: {
            "Content-Type": "application/json",
          },
        }
      );return response.data;
    } catch (error) {if (axios.isAxiosError(error)) {
        return {
          status: "error",
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details || "DAST scan failed",
        };
      }

      return {
        status: "error",
        message: "Unknown error occurred",
        details: "Failed to perform DAST scan",
      };
    }
  },

  async scanUrlFromChat(request: DASTScanRequest): Promise<DASTScanResponse> {
    try {const response = await axios.post(
        `${getBackendUrl()}/dast/scan-chat`,
        request,
        {
          timeout: 60000, // 60 second timeout for DAST scans
          headers: {
            "Content-Type": "application/json",
          },
        }
      );return response.data;
    } catch (error) {if (axios.isAxiosError(error)) {
        return {
          status: "error",
          message: error.response?.data?.message || error.message,
          details: error.response?.data?.details || "DAST scan failed",
        };
      }

      return {
        status: "error",
        message: "Unknown error occurred",
        details: "Failed to perform DAST scan",
      };
    }
  },
};

export default dastApi;
