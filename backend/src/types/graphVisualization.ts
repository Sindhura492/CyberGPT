// Simple Graph Types with 'any' to bypass TypeScript errors
export interface GraphNode {
  id: string;
  label: string;
  type: string;
  [key: string]: any; // Allow any additional properties
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: string;
  [key: string]: any; // Allow any additional properties
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: any;
}

// Graph Generation Request
export interface GraphGenerationRequest {
  messageId: string;
  chatId: string;
  question: string;
  answer: string;
  reasoning?: string;
  sources?: string[];
  jargons?: Record<string, string>;
  cveInfo?: {
    cve_id?: string;
    cve_desc?: string;
    mitigation?: string;
  };
}

// Graph Generation Response
export interface GraphGenerationResponse {
  success: boolean;
  graphData?: any;
  error?: string;
}
