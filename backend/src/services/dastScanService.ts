import puppeteer, { Browser, Page } from "puppeteer";
import * as cheerio from "cheerio";
import axios from "axios";
import { insertFactsIntoKG } from "../utils/neo4j-cve-fetch-ingest";

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

export class DASTScanService {
  private browser: Browser | null = null;

  async scanUrl(url: string): Promise<DASTScanResult> {
    console.log(`🔍 [DAST] Starting security scan for: ${url}`);

    try {
      // Validate and normalize URL
      const normalizedUrl = this.normalizeUrl(url);

      // Initialize browser
      await this.initializeBrowser();

      // Create new page
      const page = await this.browser!.newPage();

      // Configure page settings
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Set timeout
      page.setDefaultTimeout(30000);

      // Start performance monitoring
      const performanceStart = Date.now();

      // Navigate to URL with redirect tracking
      const redirects: string[] = [];
      page.on("response", (response) => {
        if (response.status() >= 300 && response.status() < 400) {
          redirects.push(response.url());
        }
      });

      const response = await page.goto(normalizedUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      if (!response) {
        throw new Error("Failed to load page");
      }

      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Collect performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(page);

      // Analyze security headers
      const securityHeaders = await this.analyzeSecurityHeaders(response);

      // Detect technologies
      const technologies = await this.detectTechnologies(page, $);

      // Analyze forms
      const forms = await this.analyzeForms($);

      // Analyze cookies
      const cookies = await this.analyzeCookies(page);

      // Run vulnerability scans
      let vulnerabilities = await this.scanVulnerabilities(page, $, response);

      // Map vulnerabilities to related CVE IDs
      console.log(`🔍 [DAST] Mapping vulnerabilities to related CVE IDs...`);
      vulnerabilities = await this.mapVulnerabilitiesToCVEs(vulnerabilities);

      // Calculate overall risk
      const overallRisk = this.calculateOverallRisk(
        vulnerabilities,
        securityHeaders
      );

      await page.close();

      const result: DASTScanResult = {
        url: normalizedUrl,
        timestamp: new Date().toISOString(),
        vulnerabilities,
        securityHeaders,
        technologies,
        forms,
        cookies,
        redirects,
        performance: performanceMetrics,
        overallRisk,
      };

      console.log(
        `✅ [DAST] Scan completed for ${normalizedUrl}. Found ${vulnerabilities.length} vulnerabilities.`
      );

      return result;
    } catch (error) {
      console.error(`❌ [DAST] Error scanning ${url}:`, error);
      throw error;
    }
  }

  private normalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }

      const urlObj = new URL(url);
      return urlObj.toString();
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      console.log("🚀 [DAST] Initializing browser...");

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-extensions",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
      });

      console.log("✅ [DAST] Browser initialized");
    }
  }

  private async getPerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      const fcp = paint.find(
        (entry) => entry.name === "first-contentful-paint"
      );
      const lcp = performance.getEntriesByType("largest-contentful-paint");

      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint:
          lcp.length > 0 ? lcp[lcp.length - 1].startTime : 0,
      };
    });

    return metrics;
  }

  private async analyzeSecurityHeaders(
    response: any
  ): Promise<SecurityHeaders> {
    const headers = response.headers();

    return {
      "strict-transport-security": headers["strict-transport-security"],
      "x-frame-options": headers["x-frame-options"],
      "x-content-type-options": headers["x-content-type-options"],
      "x-xss-protection": headers["x-xss-protection"],
      "content-security-policy": headers["content-security-policy"],
      "referrer-policy": headers["referrer-policy"],
      "permissions-policy": headers["permissions-policy"],
      "cross-origin-embedder-policy": headers["cross-origin-embedder-policy"],
      "cross-origin-opener-policy": headers["cross-origin-opener-policy"],
      "cross-origin-resource-policy": headers["cross-origin-resource-policy"],
    };
  }

  private async detectTechnologies(
    page: Page,
    $: cheerio.CheerioAPI
  ): Promise<string[]> {
    const technologies: string[] = [];

    // Check for common frameworks and libraries
    const scripts = $("script[src]");
    scripts.each((_, script) => {
      const src = $(script).attr("src")?.toLowerCase();
      if (src) {
        if (src.includes("jquery")) technologies.push("jQuery");
        if (src.includes("react")) technologies.push("React");
        if (src.includes("angular")) technologies.push("Angular");
        if (src.includes("vue")) technologies.push("Vue.js");
        if (src.includes("bootstrap")) technologies.push("Bootstrap");
        if (src.includes("d3")) technologies.push("D3.js");
        if (src.includes("lodash")) technologies.push("Lodash");
      }
    });

    // Check meta tags for framework indicators
    const generator = $('meta[name="generator"]').attr("content");
    if (generator) {
      technologies.push(generator);
    }

    // Check for WordPress
    if (
      $('link[href*="wp-content"]').length > 0 ||
      $('script[src*="wp-content"]').length > 0
    ) {
      technologies.push("WordPress");
    }

    // Check for Drupal
    if (
      $('script[src*="misc/drupal"]').length > 0 ||
      $('link[href*="misc/drupal"]').length > 0
    ) {
      technologies.push("Drupal");
    }

    // Check for Joomla
    if (
      $('script[src*="media/jui"]').length > 0 ||
      $('link[href*="media/jui"]').length > 0
    ) {
      technologies.push("Joomla");
    }

    return [...new Set(technologies)];
  }

  private async analyzeForms($: cheerio.CheerioAPI): Promise<FormAnalysis[]> {
    const forms: FormAnalysis[] = [];

    $("form").each((_, form) => {
      const $form = $(form);
      const action = $form.attr("action") || "";
      const method = ($form.attr("method") || "GET").toUpperCase();

      const inputs: FormInput[] = [];
      const formVulnerabilities: string[] = [];

      $form.find("input, textarea, select").each((_, input) => {
        const $input = $(input);
        const name = $input.attr("name") || "";
        const type = $input.attr("type") || "text";
        const required = $input.attr("required") !== undefined;

        const inputVulnerabilities: string[] = [];

        // Check for SQL injection vulnerable inputs
        if (type === "text" || type === "password") {
          inputVulnerabilities.push("Potential SQL Injection target");
        }

        // Check for XSS vulnerable inputs
        if (type === "text" || type === "textarea") {
          inputVulnerabilities.push("Potential XSS target");
        }

        inputs.push({
          name,
          type,
          required,
          vulnerabilities: inputVulnerabilities,
        });
      });

      // Check form method security
      if (
        method === "GET" &&
        inputs.some((input) => input.type === "password")
      ) {
        formVulnerabilities.push("Password sent via GET method");
      }

      // Check for HTTPS action
      if (
        action.startsWith("http://") &&
        inputs.some((input) => input.type === "password")
      ) {
        formVulnerabilities.push("Login form submitted over HTTP");
      }

      forms.push({
        action,
        method,
        inputs,
        vulnerabilities: formVulnerabilities,
      });
    });

    return forms;
  }

  private async analyzeCookies(page: Page): Promise<CookieAnalysis[]> {
    const cookies = await page.cookies();

    return cookies.map((cookie) => {
      const vulnerabilities: string[] = [];

      if (
        !cookie.secure &&
        cookie.domain &&
        !cookie.domain.includes("localhost")
      ) {
        vulnerabilities.push("Cookie not marked as secure");
      }

      if (!cookie.httpOnly) {
        vulnerabilities.push("Cookie not marked as HttpOnly");
      }

      if (cookie.sameSite === "None" && !cookie.secure) {
        vulnerabilities.push("SameSite=None without Secure flag");
      }

      return {
        name: cookie.name,
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite,
        vulnerabilities,
      };
    });
  }

  private async scanVulnerabilities(
    page: Page,
    $: cheerio.CheerioAPI,
    response: any
  ): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Check for missing security headers
    const securityHeaders = await this.analyzeSecurityHeaders(response);

    if (!securityHeaders["strict-transport-security"]) {
      vulnerabilities.push({
        id: "missing-hsts",
        name: "Missing HSTS Header",
        description: "HTTP Strict Transport Security header is not present",
        severity: "Medium",
        category: "Security Headers",
        evidence: "HSTS header not found in response",
        remediation: "Add Strict-Transport-Security header to enforce HTTPS",
        cwe: "CWE-319",
        owasp: "A05:2021 – Security Misconfiguration",
      });
    }

    if (!securityHeaders["x-frame-options"]) {
      vulnerabilities.push({
        id: "missing-xfo",
        name: "Missing X-Frame-Options Header",
        description:
          "X-Frame-Options header is not present, allowing clickjacking",
        severity: "Medium",
        category: "Security Headers",
        evidence: "X-Frame-Options header not found in response",
        remediation: "Add X-Frame-Options header to prevent clickjacking",
        cwe: "CWE-693",
        owasp: "A05:2021 – Security Misconfiguration",
      });
    }

    if (!securityHeaders["content-security-policy"]) {
      vulnerabilities.push({
        id: "missing-csp",
        name: "Missing Content Security Policy",
        description: "Content Security Policy header is not present",
        severity: "Medium",
        category: "Security Headers",
        evidence: "CSP header not found in response",
        remediation: "Implement Content Security Policy to prevent XSS attacks",
        cwe: "CWE-693",
        owasp: "A03:2021 – Injection",
      });
    }

    // Check for mixed content
    const httpResources = $(
      'img[src^="http:"], script[src^="http:"], link[href^="http:"]'
    );
    if (httpResources.length > 0 && page.url().startsWith("https://")) {
      vulnerabilities.push({
        id: "mixed-content",
        name: "Mixed Content",
        description: "HTTPS page loads HTTP resources",
        severity: "Medium",
        category: "Transport Security",
        evidence: `Found ${httpResources.length} HTTP resources on HTTPS page`,
        remediation:
          "Use HTTPS for all resources or implement upgrade-insecure-requests CSP directive",
        cwe: "CWE-319",
        owasp: "A05:2021 – Security Misconfiguration",
      });
    }

    // Check for exposed sensitive information
    const sensitiveInfo = $("*").text();
    const sensitivePatterns = [
      /password\s*[:=]\s*["'][^"']*["']/i,
      /api[_-]?key\s*[:=]\s*["'][^"']*["']/i,
      /secret\s*[:=]\s*["'][^"']*["']/i,
      /token\s*[:=]\s*["'][^"']*["']/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(sensitiveInfo)) {
        vulnerabilities.push({
          id: "exposed-secrets",
          name: "Exposed Sensitive Information",
          description:
            "Potential sensitive information exposed in page content",
          severity: "High",
          category: "Information Disclosure",
          evidence: "Found potential secrets in page content",
          remediation: "Remove sensitive information from client-side code",
          cwe: "CWE-200",
          owasp: "A01:2021 – Broken Access Control",
        });
        break;
      }
    }

    // Check for SQL injection vulnerable forms
    const forms = await this.analyzeForms($);
    forms.forEach((form) => {
      if (form.vulnerabilities.length > 0) {
        form.vulnerabilities.forEach((vuln) => {
          vulnerabilities.push({
            id: `form-${Date.now()}`,
            name: "Form Security Issue",
            description: vuln,
            severity: "Medium",
            category: "Input Validation",
            evidence: `Form at ${form.action}`,
            remediation:
              "Implement proper input validation and use HTTPS for sensitive forms",
            cwe: "CWE-89",
            owasp: "A03:2021 – Injection",
          });
        });
      }
    });

    // Check for XSS vulnerable inputs
    const textInputs = $(
      'input[type="text"], input[type="email"], input[type="url"], textarea'
    );
    if (textInputs.length > 0) {
      // Look for potential XSS patterns in JavaScript
      const scripts = $("script").text();
      const xssPatterns = [
        /innerHTML\s*=/,
        /document\.write\s*\(/,
        /eval\s*\(/,
        /setTimeout\s*\([^,]*,[^)]*\)/,
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(scripts)) {
          vulnerabilities.push({
            id: "potential-xss",
            name: "Potential XSS Vulnerability",
            description:
              "Dangerous JavaScript patterns detected that could lead to XSS",
            severity: "High",
            category: "Cross-Site Scripting",
            evidence: "Dangerous JavaScript patterns found in page scripts",
            remediation:
              "Avoid using innerHTML, document.write, eval, and unsafe setTimeout patterns",
            cwe: "CWE-79",
            owasp: "A03:2021 – Injection",
          });
          break;
        }
      }
    }

    // Check for directory traversal patterns
    const links = $("a[href], img[src], script[src], link[href]");
    links.each((_, element) => {
      const $el = $(element);
      const href = $el.attr("href") || $el.attr("src");
      if (href && /\.\.\//.test(href)) {
        vulnerabilities.push({
          id: "directory-traversal",
          name: "Potential Directory Traversal",
          description: "URLs with directory traversal patterns detected",
          severity: "Medium",
          category: "Path Traversal",
          evidence: `Found ../ pattern in: ${href}`,
          remediation: "Validate and sanitize file paths in URLs",
          cwe: "CWE-22",
          owasp: "A01:2021 – Broken Access Control",
        });
      }
    });

    return vulnerabilities;
  }

  private calculateOverallRisk(
    vulnerabilities: Vulnerability[],
    securityHeaders: SecurityHeaders
  ): "Critical" | "High" | "Medium" | "Low" | "Info" {
    const criticalCount = vulnerabilities.filter(
      (v) => v.severity === "Critical"
    ).length;
    const highCount = vulnerabilities.filter(
      (v) => v.severity === "High"
    ).length;
    const mediumCount = vulnerabilities.filter(
      (v) => v.severity === "Medium"
    ).length;

    if (criticalCount > 0) return "Critical";
    if (highCount > 0) return "High";
    if (mediumCount > 0) return "Medium";

    // Check for missing critical security headers
    const criticalHeaders = [
      "strict-transport-security",
      "x-frame-options",
      "content-security-policy",
    ];
    const missingCriticalHeaders = criticalHeaders.filter(
      (header) => !securityHeaders[header as keyof SecurityHeaders]
    ).length;

    if (missingCriticalHeaders >= 2) return "Medium";
    if (missingCriticalHeaders === 1) return "Low";

    return "Info";
  }

  private async mapVulnerabilitiesToCVEs(
    vulnerabilities: Vulnerability[]
  ): Promise<Vulnerability[]> {
    console.log(
      `🔍 [DAST] Mapping ${vulnerabilities.length} vulnerabilities to related CVE IDs`
    );

    const enhancedVulnerabilities = await Promise.all(
      vulnerabilities.map(async (vuln) => {
        try {
          console.log(
            `🔍 [DAST] Processing vulnerability: ${vuln.name} (${vuln.category})`
          );

          // Create search terms based on vulnerability characteristics
          const searchTerms = [
            vuln.name.toLowerCase(),
            vuln.category.toLowerCase(),
            ...vuln.name.toLowerCase().split(" "),
            ...vuln.category.toLowerCase().split(" "),
          ].filter((term) => term.length > 3);

          console.log(`🔍 [DAST] Search terms for ${vuln.name}:`, searchTerms);

          // Search for related CVEs using multiple approaches
          const relatedCVEs = await this.findRelatedCVEs(vuln, searchTerms);

          if (relatedCVEs.length > 0) {
            console.log(
              `✅ [DAST] Found ${relatedCVEs.length} related CVEs for ${vuln.name}:`,
              relatedCVEs.map((cve) => `${cve.cveId} (${cve.severity})`)
            );
            return {
              ...vuln,
              relatedCVEs: relatedCVEs,
            };
          } else {
            console.log(`ℹ️ [DAST] No related CVEs found for ${vuln.name}`);
            return vuln;
          }
        } catch (error) {
          console.error(
            `❌ [DAST] Error mapping CVEs for ${vuln.name}:`,
            error
          );
          return vuln;
        }
      })
    );

    const totalCVEs = enhancedVulnerabilities.reduce(
      (sum, vuln) => sum + (vuln.relatedCVEs ? vuln.relatedCVEs.length : 0),
      0
    );

    console.log(
      `✅ [DAST] CVE mapping complete. Total CVEs found: ${totalCVEs}`
    );

    return enhancedVulnerabilities;
  }

  private async findRelatedCVEs(
    vuln: Vulnerability,
    searchTerms: string[]
  ): Promise<any[]> {
    const relatedCVEs: any[] = [];

    try {
      // Method 1: Search NVD API for CVEs related to vulnerability type
      for (const term of searchTerms.slice(0, 3)) {
        // Limit to top 3 terms
        try {
          const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(term)}&resultsPerPage=5`;
          const response = await fetch(nvdUrl);

          if (response.ok) {
            const data = await response.json();
            const cves = data.vulnerabilities || [];

            // Filter CVEs that are relevant to this vulnerability type
            const relevantCVEs = cves
              .filter((cveData: any) => {
                const cve = cveData.cve;
                const description =
                  cve.descriptions?.[0]?.value?.toLowerCase() || "";
                const cveId = cve.id?.toLowerCase() || "";

                // Check if CVE description contains vulnerability-related terms
                return searchTerms.some(
                  (term) =>
                    description.includes(term) ||
                    cveId.includes(term.replace(/\s+/g, ""))
                );
              })
              .slice(0, 3); // Limit to 3 most relevant CVEs

            relatedCVEs.push(
              ...relevantCVEs.map((cveData: any) => ({
                cveId: cveData.cve.id,
                description: cveData.cve.descriptions?.[0]?.value,
                severity: this.mapCVSSToSeverity(cveData.cve.metrics),
                publishedDate: cveData.cve.published,
                relevance: this.calculateRelevance(vuln, cveData.cve),
                source: "NVD API",
              }))
            );

            // Add delay to respect rate limits
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.log(`⚠️ [DAST] NVD search failed for term "${term}":`, error);
        }
      }

      // Method 2: Use predefined vulnerability-to-CVE mappings
      const predefinedMappings = this.getPredefinedVulnerabilityMappings(vuln);
      relatedCVEs.push(...predefinedMappings);

      // Remove duplicates and sort by relevance
      const uniqueCVEs = relatedCVEs.reduce((acc, cve) => {
        if (!acc.find((existing) => existing.cveId === cve.cveId)) {
          acc.push(cve);
        }
        return acc;
      }, [] as any[]);

      return uniqueCVEs.sort((a, b) => b.relevance - a.relevance).slice(0, 5); // Return top 5 most relevant CVEs
    } catch (error) {
      console.error(`❌ [DAST] Error finding related CVEs:`, error);
      return [];
    }
  }

  private getPredefinedVulnerabilityMappings(vuln: Vulnerability): any[] {
    const mappings: Record<string, any[]> = {
      "missing-hsts": [
        {
          cveId: "CVE-2019-9511",
          description: "HTTP/2 implementation vulnerability",
          severity: "High",
          publishedDate: "2019-08-13",
          relevance: 0.8,
          source: "Predefined Mapping",
        },
      ],
      "missing-xfo": [
        {
          cveId: "CVE-2019-1010235",
          description: "Clickjacking vulnerability",
          severity: "Medium",
          publishedDate: "2019-07-09",
          relevance: 0.9,
          source: "Predefined Mapping",
        },
      ],
      "missing-csp": [
        {
          cveId: "CVE-2020-11022",
          description: "jQuery XSS vulnerability",
          severity: "Medium",
          publishedDate: "2020-04-29",
          relevance: 0.7,
          source: "Predefined Mapping",
        },
      ],
      "mixed-content": [
        {
          cveId: "CVE-2021-21224",
          description: "Mixed content security issue",
          severity: "Medium",
          publishedDate: "2021-02-08",
          relevance: 0.8,
          source: "Predefined Mapping",
        },
      ],
      "exposed-secrets": [
        {
          cveId: "CVE-2021-29441",
          description: "Information disclosure vulnerability",
          severity: "Medium",
          publishedDate: "2021-04-07",
          relevance: 0.9,
          source: "Predefined Mapping",
        },
      ],
      "potential-xss": [
        {
          cveId: "CVE-2023-26143",
          description: "Cross-site scripting vulnerability",
          severity: "High",
          publishedDate: "2023-05-17",
          relevance: 0.9,
          source: "Predefined Mapping",
        },
        {
          cveId: "CVE-2023-20887",
          description: "XSS in web application",
          severity: "High",
          publishedDate: "2023-05-09",
          relevance: 0.8,
          source: "Predefined Mapping",
        },
      ],
      "directory-traversal": [
        {
          cveId: "CVE-2023-20883",
          description: "Path traversal vulnerability",
          severity: "High",
          publishedDate: "2023-05-09",
          relevance: 0.9,
          source: "Predefined Mapping",
        },
      ],
    };

    return mappings[vuln.id] || [];
  }

  private mapCVSSToSeverity(metrics: any): string {
    if (!metrics) return "Unknown";

    const cvssV31 = metrics.cvssMetricV31?.[0];
    const cvssV30 = metrics.cvssMetricV30?.[0];
    const cvssV2 = metrics.cvssMetricV2?.[0];

    const cvssData = cvssV31 || cvssV30 || cvssV2;
    if (!cvssData) return "Unknown";

    const baseScore = cvssData.cvssData?.baseScore || cvssData.baseScore;

    if (baseScore >= 9.0) return "Critical";
    if (baseScore >= 7.0) return "High";
    if (baseScore >= 4.0) return "Medium";
    return "Low";
  }

  private calculateRelevance(vuln: Vulnerability, cveData: any): number {
    let relevance = 0.5; // Base relevance

    const description = cveData.descriptions?.[0]?.value?.toLowerCase() || "";
    const vulnName = vuln.name.toLowerCase();
    const vulnCategory = vuln.category.toLowerCase();

    // Check for exact matches
    if (description.includes(vulnName)) relevance += 0.3;
    if (description.includes(vulnCategory)) relevance += 0.2;

    // Check for keyword matches
    const keywords = vulnName.split(" ");
    keywords.forEach((keyword) => {
      if (keyword.length > 3 && description.includes(keyword)) {
        relevance += 0.1;
      }
    });

    return Math.min(relevance, 1.0);
  }

  async insertDASTResultsIntoKG(scanResult: DASTScanResult): Promise<void> {
    try {
      console.log(
        `📊 [DAST] Inserting scan results into knowledge graph for: ${scanResult.url}`
      );

      // Extract domain from URL for concept
      const urlObj = new URL(scanResult.url);
      const domain = urlObj.hostname;

      // Extract all CVE IDs from vulnerabilities
      const allCVEIds = scanResult.vulnerabilities
        .filter((vuln) => vuln.relatedCVEs && vuln.relatedCVEs.length > 0)
        .flatMap((vuln) => vuln.relatedCVEs!.map((cve) => cve.cveId));

      const allCVEDescriptions = scanResult.vulnerabilities
        .filter((vuln) => vuln.relatedCVEs && vuln.relatedCVEs.length > 0)
        .flatMap((vuln) => vuln.relatedCVEs!.map((cve) => cve.description));

      // Create comprehensive facts from DAST scan results
      const facts = {
        concept: domain,
        conceptDescription: `Web application security analysis for ${scanResult.url}`,
        cveIds: allCVEIds,
        cveDescriptions: allCVEDescriptions,
        mitigations: scanResult.vulnerabilities.map((vuln) => vuln.remediation),
        riskLevels: [scanResult.overallRisk],
        sources: [
          `DAST Scan - ${scanResult.url}`,
          `Scan Date: ${scanResult.timestamp}`,
          `Technologies: ${scanResult.technologies.join(", ")}`,
          `Vulnerabilities Found: ${scanResult.vulnerabilities.length}`,
          `Critical: ${scanResult.vulnerabilities.filter((v) => v.severity === "Critical").length}`,
          `High: ${scanResult.vulnerabilities.filter((v) => v.severity === "High").length}`,
          `Medium: ${scanResult.vulnerabilities.filter((v) => v.severity === "Medium").length}`,
          `Related CVEs: ${allCVEIds.length}`,
        ],
      };

      // Insert into knowledge graph
      await insertFactsIntoKG(facts, domain);

      console.log(
        `✅ [DAST] Successfully inserted DAST scan results into knowledge graph for ${domain}`
      );

      // Also insert individual vulnerability details
      for (const vuln of scanResult.vulnerabilities) {
        const vulnCVEs = vuln.relatedCVEs || [];
        const vulnCVEIds = vulnCVEs.map((cve) => cve.cveId);
        const vulnCVEDescriptions = vulnCVEs.map((cve) => cve.description);

        const vulnFacts = {
          concept: vuln.name,
          conceptDescription: vuln.description,
          cveIds: vulnCVEIds,
          cveDescriptions: vulnCVEDescriptions,
          mitigations: [vuln.remediation],
          riskLevels: [vuln.severity],
          sources: [
            `Evidence: ${vuln.evidence}`,
            `Category: ${vuln.category}`,
            `CWE: ${vuln.cwe || "N/A"}`,
            `OWASP: ${vuln.owasp || "N/A"}`,
            `Source: DAST Scan of ${scanResult.url}`,
            ...vulnCVEs.map(
              (cve) => `Related CVE: ${cve.cveId} (${cve.severity})`
            ),
          ],
        };

        await insertFactsIntoKG(vulnFacts, vuln.name);
      }

      console.log(
        `✅ [DAST] Inserted ${scanResult.vulnerabilities.length} individual vulnerabilities into knowledge graph`
      );
    } catch (error) {
      console.error(
        `❌ [DAST] Error inserting scan results into knowledge graph:`,
        error
      );
      // Don't throw - this shouldn't break the main flow
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log("🔒 [DAST] Browser closed");
    }
  }
}

export const dastScanService = new DASTScanService();
