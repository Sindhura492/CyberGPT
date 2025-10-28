export interface DASTScanResult {
  url: string;
  timestamp: string;
  vulnerabilities: Vulnerability[];
  securityHeaders: SecurityHeaders;
  technologies: string[];
  forms: FormAnalysis[];
  cookies: CookieAnalysis[];
  redirects: string[];
  performance: PerformanceMetrics;
  overallRisk: "Critical" | "High" | "Medium" | "Low" | "Info";
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  category: string;
  evidence: string;
  remediation: string;
  cwe?: string;
  owasp?: string;
  relatedCVEs?: Array<{
    cveId: string;
    description: string;
    severity: string;
    publishedDate: string;
    relevance: number;
    source: string;
  }>;
}

export interface SecurityHeaders {
  "strict-transport-security"?: string;
  "x-frame-options"?: string;
  "x-content-type-options"?: string;
  "x-xss-protection"?: string;
  "content-security-policy"?: string;
  "referrer-policy"?: string;
  "permissions-policy"?: string;
  "cross-origin-embedder-policy"?: string;
  "cross-origin-opener-policy"?: string;
  "cross-origin-resource-policy"?: string;
}

export interface FormAnalysis {
  action: string;
  method: string;
  inputs: FormInput[];
  vulnerabilities: string[];
}

export interface FormInput {
  name: string;
  type: string;
  required: boolean;
  vulnerabilities: string[];
}

export interface CookieAnalysis {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  vulnerabilities: string[];
}

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
}

export interface DASTScanRequest {
  url: string;
  chatId?: string;
  messageId?: string;
}

export interface DASTScanResponse {
  status: "success" | "error";
  data?: DASTScanResult;
  message?: string;
  details?: string;
  scannedUrl?: string;
}
