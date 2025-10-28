import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  chats: defineTable({
    userId: v.string(), // External userId as a string
    title: v.string(),
    tags: v.optional(v.array(v.string())), // Main tags for the chat (optional for backward compatibility)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  chatHistory: defineTable({
    chatId: v.id("chats"),
    humanInTheLoopId: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    message: v.string(),
    createdAt: v.number(),
    // New fields for extended chat history schema
    Answer: v.optional(v.string()),
    Reasoning: v.optional(v.any()),
    Sources: v.optional(v.array(v.string())),
    SourceLinks: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          type: v.string(),
        })
      )
    ),
    Jargons: v.optional(v.any()),
    Info: v.optional(
      v.object({
        cve_id: v.optional(v.string()),
        cve_desc: v.optional(v.string()),
        mitigation: v.optional(v.string()),
      })
    ),
    Severity: v.optional(v.string()),
    tags: v.array(v.string()), // Mandatory field for tags
    // Graph visualization data as key-value pairs
    graphVisualization: v.optional(
      v.object({
        vulnerabilities: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              description: v.optional(v.string()),
              severity: v.optional(v.string()),
              cvss: v.optional(v.number()),
              cveIds: v.optional(v.array(v.string())),
              affectedSystems: v.optional(v.array(v.string())),
              attackVectors: v.optional(v.array(v.string())),
              references: v.optional(v.array(v.string())),
            })
          )
        ),
        mitigations: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              description: v.optional(v.string()),
              type: v.optional(v.string()),
              effectiveness: v.optional(v.number()),
              implementation: v.optional(v.string()),
              cost: v.optional(v.string()),
              references: v.optional(v.array(v.string())),
            })
          )
        ),
        sources: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              type: v.optional(v.string()),
              url: v.optional(v.string()),
              reliability: v.optional(v.number()),
              lastUpdated: v.optional(v.number()),
              description: v.optional(v.string()),
            })
          )
        ),
        cves: v.optional(
          v.array(
            v.object({
              id: v.string(),
              cveId: v.string(),
              description: v.optional(v.string()),
              severity: v.optional(v.string()),
              cvss: v.optional(v.number()),
              publishedDate: v.optional(v.number()),
              affectedProducts: v.optional(v.array(v.string())),
              references: v.optional(v.array(v.string())),
              patches: v.optional(v.array(v.string())),
            })
          )
        ),
        problems: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              description: v.optional(v.string()),
              category: v.optional(v.string()),
              impact: v.optional(v.string()),
              priority: v.optional(v.string()),
              affectedComponents: v.optional(v.array(v.string())),
            })
          )
        ),
        affected: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              type: v.optional(v.string()),
              description: v.optional(v.string()),
              impact: v.optional(v.string()),
              systems: v.optional(v.array(v.string())),
              users: v.optional(v.array(v.string())),
            })
          )
        ),
        risks: v.optional(
          v.array(
            v.object({
              id: v.string(),
              name: v.string(),
              level: v.optional(v.string()),
              probability: v.optional(v.number()),
              impact: v.optional(v.string()),
              description: v.optional(v.string()),
              mitigation: v.optional(v.string()),
              monitoring: v.optional(v.string()),
            })
          )
        ),
        relationships: v.optional(
          v.array(
            v.object({
              id: v.optional(v.string()),
              sourceId: v.string(),
              targetId: v.string(),
              type: v.string(),
              strength: v.optional(v.number()),
              description: v.optional(v.string()),
              evidence: v.optional(v.string()),
              confidence: v.optional(v.number()),
            })
          )
        ),
      })
    ),
    // TODO list data for actionable security tasks
    todoList: v.optional(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        items: v.array(
          v.object({
            id: v.string(),
            task: v.string(),
            priority: v.union(
              v.literal("high"),
              v.literal("medium"),
              v.literal("low")
            ),
            category: v.string(),
            description: v.optional(v.string()),
            completed: v.boolean(),
            riskLevel: v.union(
              v.literal("critical"),
              v.literal("high"),
              v.literal("medium"),
              v.literal("low")
            ),
            cvssScore: v.number(),
            confidence: v.number(),
            cveIds: v.optional(v.array(v.string())),
            affectedSystems: v.optional(v.array(v.string())),

            emoji: v.optional(v.string()),
            createdAt: v.number(),
            lastModified: v.optional(v.number()),
          })
        ),
        createdAt: v.number(),
        lastModified: v.optional(v.number()),
      })
    ),
  }).index("by_chatId", ["chatId"]),

  summaries: defineTable({
    userId: v.string(), // External userId as a string
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  reportFolders: defineTable({
    userId: v.string(),
    folderName: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  reports: defineTable({
    folderId: v.id("reportFolders"),
    fileName: v.string(),
    fileUrl: v.string(),
    markdownContent: v.string(),
    reportType: v.optional(
      v.union(
        v.literal("chatSummaryReport"),
        v.literal("vulnerabilityReport"),
        v.literal("vulnerabilityTodo")
      )
    ),
    todoListData: v.optional(v.any()), // Store TODO list data for interactive editing
    chatId: v.optional(v.string()), // Chat ID for syncing back to main chat
    messageId: v.optional(v.string()), // Message ID for syncing back to main chat
    createdAt: v.number(),
  }).index("by_folderId", ["folderId"]),

  scans: defineTable({
    userId: v.string(), // Reference to the user
    targetUrl: v.string(),
    complianceStandard: v.string(),
    scanType: v.string(),
    totalRisks: v.object({
      totalVulnerabilities: v.number(),
      Medium: v.number(),
      High: v.number(),
      Low: v.number(),
      Critical: v.number(),
      Informational: v.number(),
    }),
  }).index("by_userId", ["userId"]),

  vulnerabilities: defineTable({
    scanId: v.id("scans"), // Reference to the scan
    alert: v.string(),
    AffectedUrisCount: v.string(),
    riskDesc: v.string(),
  }).index("by_scanId", ["scanId"]),

  vulnerabilityInfo: defineTable({
    vulnerabilityId: v.id("vulnerabilities"),
    riskLevel: v.string(),
    cweId: v.string(),
    cveIds: v.array(v.string()),
    description: v.string(),
    affectedUrls: v.array(
      v.object({
        uri: v.string(),
        method: v.string(),
        attack: v.string(),
        evidence: v.string(),
      })
    ),
    solution: v.string(),
    confidence: v.string(),
    reference: v.string(),
  }).index("by_vulnerabilityId", ["vulnerabilityId"]),

  staticScans: defineTable({
    userId: v.string(),
    repoType: v.string(),
    projectKey: v.string(),
    metrics: v.optional(
      v.object({
        coverage: v.string(),
        bugs: v.string(),
        reliability_rating: v.string(),
        code_smells: v.string(),
        duplicated_lines_density: v.string(),
        security_rating: v.string(),
        ncloc: v.string(),
        vulnerabilities: v.string(),
        software_quality_maintainability_rating: v.string(),
      })
    ),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  hotspotList: defineTable({
    staticScanId: v.id("staticScans"),
    message: v.string(),
    vulnerabilityProbability: v.string(),
    component: v.string(),
    line: v.number(),
    review_status: v.boolean(),
  }).index("by_staticScanId", ["staticScanId"]),

  issueList: defineTable({
    staticScanId: v.id("staticScans"),
    message: v.string(),
    component: v.string(),
    line: v.number(),
    severity: v.string(),
    type: v.string(),
    effort: v.string(),
    debt: v.string(),
    review_status: v.boolean(),
  }).index("by_staticScanId", ["staticScanId"]),

  todoLists: defineTable({
    chatId: v.string(),
    messageId: v.string(),
    todoList: v.any(), // TodoList object with all items and metadata
    lastModified: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_message_chat", ["messageId", "chatId"])
    .index("by_chat", ["chatId"]),
});
