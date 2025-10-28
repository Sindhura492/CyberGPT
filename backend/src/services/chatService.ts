import { OpenAIService } from "./openai";
import { PineconeService } from "./pineconeStore";
import type { ChatCompletionMessageParam } from "openai/resources/chat";
import type { ScanResults, FilteredAlert } from "../types/scan";
import type { SonarScanReport } from "../types/sastScan";

import { chatStreamSystemPrompt } from "../prompts/systemPromps";

interface Document {
  pageContent: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class ChatService {
  private static instance: ChatService;
  private openai: OpenAIService;
  private pinecone: PineconeService | null;

  constructor(openai: OpenAIService, pinecone: PineconeService | null) {
    this.openai = openai;
    this.pinecone = pinecone;
  }

  public static async getInstance(): Promise<ChatService> {
    if (!ChatService.instance) {
      const openai = OpenAIService.getInstance();
      const pinecone = await PineconeService.getInstance();
      ChatService.instance = new ChatService(openai, pinecone);
    }
    return ChatService.instance;
  }

  private createSummaryPrompt(scanResults: ScanResults, type?: string): string {
    const totalVulnerabilities = scanResults.totals;

    // Create risk distribution string
    const riskDistribution = Object.entries({
      Critical: scanResults.totals.critical,
      High: scanResults.totals.high,
      Medium: scanResults.totals.medium,
      Low: scanResults.totals.low,
      Informational: scanResults.totals.informational,
      TotalIssues: scanResults.totals.totalIssues,
    })
      .map(([level, count]) => `${level}: ${count}`)
      .join(", ");

    // Format findings
    const formattedFindings = scanResults.filteredAlerts
      .map(
        (finding: FilteredAlert, index: number) => `
				${index + 1}. ${finding.name}
				- Risk Level: ${finding.riskdesc}
				- Description: ${finding.desc}
				- Impact: Based on CWE-${finding.cweid}
				- CVEs: ${
          Array.isArray(finding.cve_id) && finding.cve_id.length > 0
            ? finding.cve_id.join(", ")
            : "None identified"
        }
				- Solution: ${finding.solution}
				`
      )
      .join("\n");
    if (type === "detailed") {
      return `
				Format the response in markdown format with clear sections and bullet points for readability.	
					Generate a vulnerability report based on the following data in Markdown format:

					The CWE should be in a link format to the official CWE website.

						- URL: ${scanResults.targetUrl}
						- Report Date: ${new Date().toLocaleDateString()}
						- Compliance Standard: ${scanResults.complianceStandardUrl}
						- Total Vulnerabilities: ${totalVulnerabilities}
						- Risk Distribution: ${riskDistribution}

						Detailed Findings:
						${formattedFindings}
						---

						Output format in Markdown:
						# Vulnerability Report

						## Website Name: {applicationName}
						### Report Date: {reportDate}

						---

						## Summary
						This report details vulnerabilities identified during a recent security assessment.

						### Key Findings:
						In bullet points, summarize the most critical vulnerabilities and their count.
						{riskDistribution}

						---

						## Vulnerabilities

						{vulnerabilities}

						---

						## Recommendations
						{recommendations}
			
					
	
`;
    }

    return `	Analyze the following OWASP ZAP security scan results for ${scanResults.targetUrl} and provide a comprehensive security assessment:

					The CWE and CVEs should be in a link format to the official CWE website.
					Target Information:
						- URL: ${scanResults.targetUrl}
						- Compliance Standard: ${scanResults.complianceStandardUrl}
						- Total Vulnerabilities: ${totalVulnerabilities}
						- Risk Distribution: ${riskDistribution}

						Detailed Findings:
						${formattedFindings}

						Please provide:
						1. Executive Summary: A brief overview of the scan results and their potential business impact
						2. Critical Findings: Highlight the most severe vulnerabilities that require immediate attention
						3. Risk Analysis: Break down the findings by risk level and provide context for each category
						4. Remediation Roadmap: Prioritized list of recommendations with:
						- Immediate actions (24-48 hours)
						- Short-term fixes (1-2 weeks)
						- Long-term security improvements

						Format the response in markdown format with clear sections and bullet points for readability.			
	`;
  }

  private createSastSummaryPrompt(
    scanResults: SonarScanReport,
    type?: string
  ): string {
    const totalVulnerabilities = scanResults.metrics.vulnerabilities;

    if (type === "detailed") {
      return `
**Format the report in Markdown** for better readability.

# Security Assessment Report

## Project Overview
- **Project Key:** ${scanResults.projectKey}
- **Total Lines of Code:** ${scanResults.metrics.ncloc}

## Code Quality Metrics
### Quantitative Analysis
- **Code Coverage:** ${scanResults.metrics.coverage}%
- **Duplicated Lines Density:** ${scanResults.metrics.duplicated_lines_density}%
- **Reliability Rating:** ${scanResults.metrics.reliability_rating}/5
- **Security Rating:** ${scanResults.metrics.security_rating}/5
- **Maintainability Rating:** ${scanResults.metrics.software_quality_maintainability_rating}/5

## Vulnerability Breakdown
### Identified Issues
- **Bugs:** ${scanResults.metrics.bugs} total
- **Code Smells:** ${scanResults.metrics.code_smells} total
- **Security Vulnerabilities:** ${scanResults.metrics.vulnerabilities} total
- **Security Hotspots:** ${scanResults.hotspots.length}

## Critical Findings
### Detailed Vulnerability Analysis
${
  scanResults.issues.length > 0
    ? scanResults.issues
        .map(
          (issue) => `
#### Issue: ${issue.message}
- **Severity:** ${issue.severity}
- **Component:** ${issue.component} (Line ${issue.line})
- **Rule Violation:** ${typeof issue.rule === "object" ? issue.rule?.name : issue.rule}
- **Description:** ${typeof issue.rule === "object" ? issue.rule?.description : "No description available"}
`
        )
        .join("\n")
    : "No security vulnerabilities found."
}

  ## Summary and Recommendations
### Security Recommendations:
1. **Prioritize High and Critical Severity Issues**: Immediate action is required for critical security flaws.
2. **Reduce Code Smells**: Improve maintainability by refactoring complex code sections.
3. **Increase Test Coverage**: Improve unit and integration test coverage to enhance reliability.
4. **Fix Duplicated Code**: Reduce redundancy to improve maintainability and reduce technical debt.
5. **Follow Secure Coding Best Practices**: Implement secure development guidelines to prevent future vulnerabilities.`;
    }
    return `Analyze the SonarQube security scan results for the ${scanResults.projectKey} project. Provide a comprehensive security assessment:

				1. Overall Code Quality Metrics:
				- Total Lines of Code:  ${scanResults.metrics.ncloc}
				- Code Coverage: ${scanResults.metrics.coverage}%
				- Reliability Rating: ${scanResults.metrics.reliability_rating}
				- Maintainability Rating: ${scanResults.metrics.software_quality_maintainability_rating}

				2. Key Vulnerability Insights:
				- Total Bugs: ${scanResults.metrics.bugs}
				- Total Code Smells: ${scanResults.metrics.code_smells}
				- Security Vulnerabilities: ${scanResults.metrics.vulnerabilities}
				- Security Hotspots: ${scanResults.hotspots.length}

				3. Critical Issues Highlights:
				- Critical Code Smell
				- Potential HTTP method security risk
				- Resource integrity concerns in HTML templates

				4. Immediate Recommendations:
				- Refactor datetime methods to use timezone-aware objects
				- Review HTTP method configurations
				- Implement resource integrity checks

				Deliver a succinct executive summary emphasizing the most critical security and code quality risks.
				Format the response in markdown with clear sections and bullet points for readability.	
`;
  }

  async processScanSummary(scanResults: ScanResults) {
    const prompt = this.createSummaryPrompt(scanResults);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];

    return this.openai.chatStream(messages);
  }

  async processSastScanSummary(scanResults: SonarScanReport) {
    const prompt = this.createSastSummaryPrompt(scanResults);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];

    return this.openai.chatStream(messages);
  }

  async generateTitle(botMessage: string): Promise<string> {
    const systemMessage = `Generate a short, concise title maximum 6 words without any quotatations for the following paragraph: ${botMessage}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
    ];

    return this.openai.chat(messages);
  }

  async generateTitleAndTag(
    botMessage: string
  ): Promise<{ title: string; tag: string }> {
    try {
      const systemMessage = `Based on the following conversation content, generate:
1. A short, concise title (maximum 6 words, no quotations)
2. A single relevant tag that best categorizes this conversation (e.g., "cybersecurity", "vulnerability_analysis", "security_assessment", "compliance", "penetration_testing", "risk_management")

Content: ${botMessage}

Respond in JSON format: {"title": "Your Title Here", "tag": "your_tag_here"}`;

      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
      ];

      const response = await this.openai.chat(messages);
      console.log("OpenAI response for title and tag:", response);

      // Try to extract JSON from the response
      let jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log("Extracted JSON string:", jsonStr);

        try {
          const parsed = JSON.parse(jsonStr);
          console.log("Parsed JSON:", parsed);
          return {
            title: parsed.title || "Chat",
            tag: parsed.tag || "cybersecurity_general",
          };
        } catch (parseError) {
          console.error("Failed to parse extracted JSON:", parseError);
        }
      }

      // If JSON parsing fails, try to extract title and tag manually
      const titleMatch = response.match(/"title":\s*"([^"]+)"/i);
      const tagMatch = response.match(/"tag":\s*"([^"]+)"/i);

      if (titleMatch && tagMatch) {
        return {
          title: titleMatch[1] || "Chat",
          tag: tagMatch[1] || "cybersecurity_general",
        };
      }

      // Final fallback - just generate title
      console.log("Using fallback title generation");
      const title = await this.generateTitle(botMessage);
      return {
        title: title,
        tag: "cybersecurity_general",
      };
    } catch (error) {
      console.error("Error in generateTitleAndTag:", error);
      // Fallback to original title generation
      const title = await this.generateTitle(botMessage);
      return {
        title: title,
        tag: "cybersecurity_general",
      };
    }
  }

  async processMessageStream(
    message: string,
    useRAG: boolean,
    previousMessages: ChatMessage[] = []
  ) {
    if (!useRAG) {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: chatStreamSystemPrompt },
        ...previousMessages,
        { role: "user", content: message },
      ];

      return this.openai.chatStream(messages);
    }

    if (!this.pinecone) {
      console.warn("Pinecone not configured, returning without RAG");
      return this.openai.chatStream(messages);
    }

    const docs: Document[] = await this.pinecone.similaritySearch(message);
    console.log(docs);

    return this.openai.generateRagAnswer(docs);
  }
  async generateDetailedSummary(scanResult: ScanResults): Promise<string> {
    const prompt = this.createSummaryPrompt(scanResult, "detailed");
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];
    return this.openai.chat(messages);
  }

  async generateDetailedSastSummary(
    scanSastResult: SonarScanReport
  ): Promise<string> {
    const prompt = this.createSastSummaryPrompt(scanSastResult, "detailed");
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: prompt },
    ];
    return this.openai.chat(messages);
  }

  async processChatSummary(messages: string[]) {
    const prompt = messages.join("\n");
    const chatMessages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "Generate a summary of the following chat messages in markdown format:",
      },
      { role: "user", content: prompt },
    ];

    return this.openai.chatStream(chatMessages);
  }
}
