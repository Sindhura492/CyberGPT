export interface GraphNode {
  id: string;
  label: string;
  type:
    | "vulnerability"
    | "mitigation"
    | "source"
    | "cve"
    | "problem"
    | "affected"
    | "risk";
  severity?: "Critical" | "High" | "Medium" | "Low" | "Info";
  description?: string;
  cvss?: number;
  confidence?: number;
  source?: string;
  metadata?: Record<string, any>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: "mitigates" | "affects" | "references" | "causes" | "relates_to";
  strength?: number;
  description?: string;
}

export interface GraphElement {
  id: string;
  name: string;
  description?: string;
  [key: string]: any;
}

export interface VulnerabilityElement extends GraphElement {
  severity?: string;
  cvss?: number;
  cveIds?: string[];
  affectedSystems?: string[];
  attackVectors?: string[];
  references?: string[];
}

export interface MitigationElement extends GraphElement {
  type?: string;
  effectiveness?: number;
  implementation?: string;
  cost?: string;
  references?: string[];
}

export interface SourceElement extends GraphElement {
  type?: string;
  url?: string;
  reliability?: number;
  lastUpdated?: number;
}

export interface CVEElement extends GraphElement {
  cveId: string;
  severity?: string;
  cvss?: number;
  publishedDate?: number;
  affectedProducts?: string[];
  references?: string[];
  patches?: string[];
}

export interface ProblemElement extends GraphElement {
  category?: string;
  impact?: string;
  priority?: string;
  affectedComponents?: string[];
}

export interface AffectedElement extends GraphElement {
  type?: string;
  impact?: string;
  systems?: string[];
  users?: string[];
}

export interface RiskElement extends GraphElement {
  level?: string;
  probability?: number;
  impact?: string;
  mitigation?: string;
  monitoring?: string;
}

export interface RelationshipElement {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  strength?: number;
  description?: string;
  evidence?: string;
  confidence?: number;
}

export interface GraphElements {
  vulnerabilities?: VulnerabilityElement[];
  mitigations?: MitigationElement[];
  sources?: SourceElement[];
  cves?: CVEElement[];
  problems?: ProblemElement[];
  affected?: AffectedElement[];
  risks?: RiskElement[];
  relationships?: RelationshipElement[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: {
    title: string;
    description: string;
    createdAt: number;
    messageId: string;
    chatId: string;
  };
  graphElements?: GraphElements;
}

export interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
  className?: string;
}

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

export interface GraphGenerationResponse {
  success: boolean;
  graphData?: GraphData;
  error?: string;
}

export interface StoredGraph {
  _id: string;
  messageId: string;
  chatId: string;
  graphData: GraphData;
  createdAt: number;
  updatedAt: number;
}
