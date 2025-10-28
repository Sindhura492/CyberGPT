// Utility for normalizing vulnerability names and handling aliases

const aliasMap: Record<string, string> = {
  "css scripting": "Cross-Site Scripting (XSS)",
  "xss scripting": "Cross-Site Scripting (XSS)",
  "cross site scripting": "Cross-Site Scripting (XSS)",
  "sql injection": "SQL Injection",
  "sqli": "SQL Injection",
  "ssrf": "Server-Side Request Forgery (SSRF)",
  "server side request forgery": "Server-Side Request Forgery (SSRF)",
  "server-side request forgery": "Server-Side Request Forgery (SSRF)",
  "directory traversal": "Directory Traversal Vulnerability",
  "rce": "Remote Code Execution Vulnerability",
  // Logic Bomb aliases
  "logic bomb": "Logic Bomb",
  "malicious logic bomb": "Logic Bomb",
  "logicbomb": "Logic Bomb",
  // Add more mappings as needed
};

// Optionally, add fuzzy matching here in the future
export function normalizeVulnName(query: string): string {
  let lower = query.toLowerCase().trim();
  lower = lower.replace(/[.?!,;:]+$/, ''); // Remove trailing punctuation
  lower = lower.replace(/\s+/g, ' '); // Normalize whitespace
  if (aliasMap[lower]) return aliasMap[lower];
  return lower;
} 