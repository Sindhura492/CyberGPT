export interface Chats {
  _id: string;
  title: string;
  tags?: string[]; // Optional for backward compatibility with existing chats
  createdAt: string;
}

export interface Info {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface ChatHistory {
  _id: string;
  humanInTheLoopId: string;
  chatId: string;
  message: string;
  sender: string;
  createdAt: string;
  // Enhanced fields
  Answer?: string;
  Reasoning?: any;
  Sources?: string[];
  SourceLinks?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  Jargons?: Record<string, string>;
  Info?: {
    cve_id?: string;
    cve_desc?: string;
    mitigation?: string;
  };
  Severity?: string;
  tags?: string[];
}

export interface ReasoningStep {
  step: string;
  message: string;
}

export interface Message {
  id?: string;
  humanInTheLoopId?: string;
  chatId?: string;
  hitId?: string;
  message: string;
  actionPrompts?: { id: string; name: string; type: sting }[];
  sender: "user" | "ai";
  humanInTheLoopMessage?: string;
  actionType?: string;
  confirmType?: string;
  isStreaming?: boolean;
  reasoningTrace?: ReasoningStep[];
  isRelatedQuestion?: boolean;
  jargons?: { term: string; description: string }[];
  cveDescriptionsMap?: Record<string, string>;
  sourceLinks?: Array<{
    title: string;
    url: string;
    type: "official" | "reference" | "framework";
  }>;
  /** Time taken (in seconds) for the AI to respond */
  durationSec?: number;
  tags?: string[];
  /** DAST scan results if URL was scanned */
  dastScanResults?: any;
  scannedUrl?: string;
}

export interface RequestHumanInLoop {
  action: string; // action for the approval message
  prompt?: string; // prompt to show to the human
  type?: string; // type of action to perform [none for options] [action type for approval]
  id?: string; // id to link the approval message to the action
}
