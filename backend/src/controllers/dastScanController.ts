import { Context } from "hono";
import { dastScanService, DASTScanResult } from "../services/dastScanService";

export class DASTScanController {
  async scanUrl(c: Context) {
    try {
      const body = await c.req.json();
      const { url } = body;

      if (!url) {
        return c.json(
          {
            status: "error",
            message: "URL parameter is required",
          },
          400
        );
      }

      console.log(`🔍 [DASTController] Starting scan for URL: ${url}`);

      // Validate URL format
      try {
        new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch (error) {
        return c.json(
          {
            status: "error",
            message: "Invalid URL format",
          },
          400
        );
      }

      // Perform DAST scan
      const scanResult: DASTScanResult = await dastScanService.scanUrl(url);

      console.log(
        `✅ [DASTController] Scan completed for ${url}. Risk level: ${scanResult.overallRisk}`
      );

      return c.json({
        status: "success",
        data: scanResult,
      });
    } catch (error) {
      console.error("❌ [DASTController] Error during scan:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return c.json(
        {
          status: "error",
          message: errorMessage,
          details: "DAST scan failed. Please check the URL and try again.",
        },
        500
      );
    }
  }

  async scanUrlFromChat(c: Context) {
    try {
      const body = await c.req.json();
      const { url, chatId, messageId } = body;

      if (!url) {
        return c.json(
          {
            status: "error",
            message: "URL parameter is required",
          },
          400
        );
      }

      console.log(
        `🔍 [DASTController] Starting chat-integrated scan for URL: ${url}`
      );

      // Perform DAST scan
      const scanResult: DASTScanResult = await dastScanService.scanUrl(url);

      // Generate a story-like analysis of the scan results
      const analysis = await this.generateScanAnalysis(scanResult);

      console.log(`✅ [DASTController] Chat scan completed for ${url}`);

      return c.json({
        status: "success",
        data: {
          scanResult,
          analysis,
          chatId,
          messageId,
        },
      });
    } catch (error) {
      console.error("❌ [DASTController] Error during chat scan:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return c.json(
        {
          status: "error",
          message: errorMessage,
          details: "DAST scan failed. Please check the URL and try again.",
        },
        500
      );
    }
  }

  private async generateScanAnalysis(
    scanResult: DASTScanResult
  ): Promise<string> {
    const {
      url,
      vulnerabilities,
      overallRisk,
      securityHeaders,
      technologies,
      forms,
    } = scanResult;

    let analysis = `🔍 **Security Analysis Report for ${url}**\n\n`;

    // Risk Overview
    analysis += `## 🚨 Overall Risk Level: ${overallRisk.toUpperCase()}\n\n`;

    const riskEmoji = {
      Critical: "🔴",
      High: "🟠",
      Medium: "🟡",
      Low: "🟢",
      Info: "🔵",
    };

    analysis += `${riskEmoji[overallRisk]} **Risk Assessment Summary:**\n`;
    analysis += `- **Total Vulnerabilities Found:** ${vulnerabilities.length}\n`;
    analysis += `- **Critical Issues:** ${vulnerabilities.filter((v) => v.severity === "Critical").length}\n`;
    analysis += `- **High Priority Issues:** ${vulnerabilities.filter((v) => v.severity === "High").length}\n`;
    analysis += `- **Medium Priority Issues:** ${vulnerabilities.filter((v) => v.severity === "Medium").length}\n\n`;

    // Technology Stack
    if (technologies.length > 0) {
      analysis += `## 🛠️ **Detected Technologies**\n`;
      analysis += `The website appears to be built using:\n`;
      technologies.forEach((tech) => {
        analysis += `- ${tech}\n`;
      });
      analysis += "\n";
    }

    // Security Headers Analysis
    analysis += `## 🔒 **Security Headers Analysis**\n`;
    const criticalHeaders = [
      "strict-transport-security",
      "x-frame-options",
      "content-security-policy",
      "x-content-type-options",
      "referrer-policy",
    ];

    const missingHeaders = criticalHeaders.filter(
      (header) => !securityHeaders[header as keyof typeof securityHeaders]
    );

    if (missingHeaders.length === 0) {
      analysis += `✅ **Excellent!** All critical security headers are properly configured.\n\n`;
    } else {
      analysis += `⚠️ **Missing Critical Security Headers:**\n`;
      missingHeaders.forEach((header) => {
        analysis += `- ${header.replace(/-/g, " ").toUpperCase()}\n`;
      });
      analysis += "\n";
    }

    // Vulnerability Details
    if (vulnerabilities.length > 0) {
      analysis += `## 🚨 **Security Vulnerabilities Found**\n\n`;

      vulnerabilities.forEach((vuln, index) => {
        const severityEmoji = {
          Critical: "🔴",
          High: "🟠",
          Medium: "🟡",
          Low: "🟢",
          Info: "🔵",
        };

        analysis += `### ${index + 1}. ${severityEmoji[vuln.severity]} ${vuln.name}\n`;
        analysis += `**Severity:** ${vuln.severity}\n`;
        analysis += `**Category:** ${vuln.category}\n`;
        analysis += `**Description:** ${vuln.description}\n`;
        analysis += `**Evidence:** ${vuln.evidence}\n`;
        analysis += `**Remediation:** ${vuln.remediation}\n`;

        if (vuln.cwe) {
          analysis += `**CWE Reference:** ${vuln.cwe}\n`;
        }
        if (vuln.owasp) {
          analysis += `**OWASP Reference:** ${vuln.owasp}\n`;
        }
        analysis += "\n";
      });
    } else {
      analysis += `## ✅ **No Critical Vulnerabilities Detected**\n\n`;
      analysis += `Great news! The automated scan didn't detect any obvious security vulnerabilities. However, this doesn't guarantee complete security - consider conducting a comprehensive penetration test for critical applications.\n\n`;
    }

    // Form Security Analysis
    if (forms.length > 0) {
      analysis += `## 📝 **Form Security Analysis**\n`;
      analysis += `Found ${forms.length} form(s) on the page:\n\n`;

      forms.forEach((form, index) => {
        analysis += `### Form ${index + 1}\n`;
        analysis += `- **Action:** ${form.action}\n`;
        analysis += `- **Method:** ${form.method}\n`;
        analysis += `- **Input Fields:** ${form.inputs.length}\n`;

        if (form.vulnerabilities.length > 0) {
          analysis += `- **Security Issues:**\n`;
          form.vulnerabilities.forEach((vuln) => {
            analysis += `  - ${vuln}\n`;
          });
        }
        analysis += "\n";
      });
    }

    // Recommendations
    analysis += `## 💡 **Security Recommendations**\n`;

    if (overallRisk === "Critical" || overallRisk === "High") {
      analysis += `🚨 **Immediate Action Required:**\n`;
      analysis += `- Address all Critical and High severity vulnerabilities immediately\n`;
      analysis += `- Implement missing security headers\n`;
      analysis += `- Conduct a comprehensive security audit\n`;
      analysis += `- Consider implementing a Web Application Firewall (WAF)\n\n`;
    } else if (overallRisk === "Medium") {
      analysis += `⚠️ **Recommended Actions:**\n`;
      analysis += `- Address Medium severity vulnerabilities in the next security cycle\n`;
      analysis += `- Implement missing security headers\n`;
      analysis += `- Regular security monitoring and updates\n\n`;
    } else {
      analysis += `✅ **Maintenance Recommendations:**\n`;
      analysis += `- Keep security headers up to date\n`;
      analysis += `- Regular security assessments\n`;
      analysis += `- Monitor for new vulnerabilities\n\n`;
    }

    analysis += `## 🔍 **Scan Details**\n`;
    analysis += `- **Scan Timestamp:** ${new Date(scanResult.timestamp).toLocaleString()}\n`;
    analysis += `- **Total Scan Time:** ${scanResult.performance.loadTime.toFixed(2)}ms\n`;
    analysis += `- **Page Load Time:** ${scanResult.performance.firstContentfulPaint.toFixed(2)}ms\n\n`;

    analysis += `*This automated scan provides a high-level security assessment. For comprehensive security testing, consider professional penetration testing services.*\n`;

    return analysis;
  }
}

export const dastScanController = new DASTScanController();
