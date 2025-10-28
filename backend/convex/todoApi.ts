import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Types
interface TodoItem {
  id: string;
  task: string;
  priority: "low" | "medium" | "high";
  category: string;
  description: string;
  completed: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  cvssScore: number;
  confidence: number;
  cveIds: string[];
  affectedSystems: string[];
  emoji: string;
  createdAt: number;
}

interface TodoList {
  id: string;
  title: string;
  description: string;
  items: TodoItem[];
  createdAt: number;
  lastModified: number;
}

// Generate TODO tasks ONLY when user clicks the button
export const generateTodoTasksOnDemand = action({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
    userQuestion: v.optional(v.string()),
    aiResponse: v.optional(v.string()),
    kgContext: v.optional(v.any()),
    cveInfo: v.optional(v.any()),
    reasoningTrace: v.optional(v.any()),
    sourceLinks: v.optional(v.any()),
    jargons: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    console.log(
      "🚀 [TODO API] Generate TODO tasks on demand - User clicked button!"
    );

    const {
      chatId,
      messageId,
      userQuestion = "",
      aiResponse = "",
      kgContext,
      cveInfo,
      reasoningTrace,
      sourceLinks,
      jargons,
    } = args;

    console.log("🔄 [TODO API] Starting on-demand TODO generation:", {
      chatId,
      messageId,
      userQuestion: userQuestion.substring(0, 100) + "...",
      aiResponseLength: aiResponse.length,
      hasKGContext: !!kgContext,
      hasCVEInfo: !!cveInfo,
    });

    try {
      // Generate tasks dynamically using AI based on the ACTUAL content
      const generatedTasks: TodoItem[] = [];

      // Create a TRULY DYNAMIC prompt that analyzes the actual response content
      const dynamicPrompt = `You are a senior cybersecurity expert and developer. Analyze this security discussion and generate 6-8 HIGHLY SPECIFIC, DEVELOPER-FRIENDLY tasks.

QUESTION: "${userQuestion}"
AI RESPONSE: "${aiResponse}"

CRITICAL INSTRUCTIONS:
- Read the AI response carefully and extract the EXACT vulnerability types mentioned
- Extract the EXACT attack vectors, technologies, and systems discussed
- Extract any specific CVEs, tools, or frameworks mentioned
- Generate tasks that are SPECIFIC to what was actually discussed
- Do NOT use generic templates or predefined vulnerability types
- Make each task actionable and specific to the content

ANALYSIS REQUIREMENTS:
1. What specific vulnerability type is mentioned? (e.g., TOCTOU, SSRF, XSS, SQL injection, buffer overflow, etc.)
2. What specific attack vectors are discussed? (e.g., file operations, database queries, web requests, etc.)
3. What specific technologies are mentioned? (e.g., file systems, databases, web applications, cloud services, etc.)
4. What specific CVEs are referenced?
5. What specific tools or frameworks are mentioned?

TASK GENERATION:
- Create tasks that directly address the specific vulnerability and attack vectors mentioned
- Make task titles specific to the vulnerability type discussed
- Make descriptions provide step-by-step solutions for the specific issue
- Include specific technologies, tools, and systems mentioned in the response
- Focus on practical implementation steps developers can follow

OUTPUT FORMAT (JSON array only):
[
  {
    "task": "[Specific vulnerability type] task with emoji - e.g., '🔧 Fix TOCTOU race conditions in file operations'",
    "priority": "high|medium|low",
    "category": "Development|Testing|Configuration|Monitoring|Documentation|Deployment",
    "description": "Step-by-step implementation: 1) [Specific step 1], 2) [Specific step 2], 3) [Specific step 3]. Include specific tools and technologies mentioned in the response.",
    "riskLevel": "critical|high|medium|low",
    "cvssScore": 0.0-10.0,
    "confidence": 0.0-1.0,
    "cveIds": ["CVE-XXXX-XXXX"],
    "affectedSystems": ["Specific systems mentioned in response"],
    "emoji": "🔧"
  }
]

Return only valid JSON array, no additional text.`;

      try {
        console.log(
          "🤖 [TODO API] Calling OpenAI for dynamic task generation..."
        );

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content:
                    "You are a cybersecurity expert who generates highly specific, actionable tasks based on security discussions. Always extract the exact vulnerability types and attack vectors mentioned in the response.",
                },
                {
                  role: "user",
                  content: dynamicPrompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;

          if (content) {
            console.log("✅ [TODO API] AI generation successful");
            console.log(
              "🔍 [TODO API] Raw AI response:",
              content.substring(0, 300) + "..."
            );

            // Clean and parse the AI response
            let cleanedContent = content.trim();

            // Remove markdown code blocks if present
            if (cleanedContent.startsWith("```json")) {
              cleanedContent = cleanedContent
                .replace(/^```json\s*/, "")
                .replace(/\s*```$/, "");
            } else if (cleanedContent.startsWith("```")) {
              cleanedContent = cleanedContent
                .replace(/^```\s*/, "")
                .replace(/\s*```$/, "");
            }

            // Try to extract JSON array from the content
            let jsonMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              cleanedContent = jsonMatch[0];
            }

            console.log(
              "🔍 [TODO API] Cleaned content:",
              cleanedContent.substring(0, 300) + "..."
            );

            try {
              const parsedTasks = JSON.parse(cleanedContent);
              console.log("🔍 [TODO API] Parsed tasks:", parsedTasks);

              if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                const tasks = parsedTasks.map((task: any, index: number) => ({
                  id: `todo-${Date.now()}-ai-${index}`,
                  task: task.task || `Task ${index + 1}`,
                  priority: task.priority || "medium",
                  category: task.category || "Development",
                  description: task.description || "Generated task",
                  completed: false,
                  riskLevel: task.riskLevel || "medium",
                  cvssScore: task.cvssScore || 5.0,
                  confidence: task.confidence || 0.8,
                  cveIds: task.cveIds || [],
                  affectedSystems: task.affectedSystems || ["Codebase"],
                  emoji: task.emoji || "🔧",
                  createdAt: Date.now(),
                }));
                generatedTasks.push(...tasks);
                console.log(`✅ [TODO API] Generated ${tasks.length} AI tasks`);
              }
            } catch (parseError) {
              console.log("⚠️ [TODO API] JSON parsing failed:", parseError);
              console.log(
                "🔍 [TODO API] Content that failed to parse:",
                cleanedContent
              );
            }
          }
        } else {
          console.log("❌ [TODO API] OpenAI API error:", response.status);
        }
      } catch (aiError) {
        console.error("❌ [TODO API] AI task generation failed:", aiError);
      }

      // If AI generation failed, create simple fallback tasks
      if (generatedTasks.length < 4) {
        console.log(
          "🔄 [TODO API] Creating fallback tasks based on content analysis..."
        );

        const responseLower = aiResponse.toLowerCase();

        // Extract specific vulnerability types from the actual content
        let vulnerabilityType = "security vulnerability";
        let attackVector = "";
        let specificTechnology = "";

        // Extract specific vulnerability types
        if (
          responseLower.includes("toctou") ||
          responseLower.includes("time of check to time of use")
        ) {
          vulnerabilityType = "TOCTOU";
          attackVector = "file operations and permission changes";
        } else if (responseLower.includes("race condition")) {
          vulnerabilityType = "race condition";
          attackVector = "concurrent access and synchronization";
        } else if (
          responseLower.includes("ssrf") ||
          responseLower.includes("server side request forgery")
        ) {
          vulnerabilityType = "SSRF";
          attackVector = "cloud metadata endpoints and internal services";
        } else if (
          responseLower.includes("xss") ||
          responseLower.includes("cross-site scripting")
        ) {
          vulnerabilityType = "XSS";
          attackVector = "web application input validation";
        } else if (
          responseLower.includes("sql injection") ||
          responseLower.includes("sqli")
        ) {
          vulnerabilityType = "SQL injection";
          attackVector = "database queries and input sanitization";
        } else if (responseLower.includes("buffer overflow")) {
          vulnerabilityType = "buffer overflow";
          attackVector = "memory management and bounds checking";
        } else if (
          responseLower.includes("log4shell") ||
          responseLower.includes("log4j")
        ) {
          vulnerabilityType = "Log4Shell";
          attackVector = "JNDI lookups and deserialization";
        }

        // Extract specific technologies
        if (
          responseLower.includes("file system") ||
          responseLower.includes("file operations")
        ) {
          specificTechnology = "file systems";
        } else if (
          responseLower.includes("database") ||
          responseLower.includes("sql")
        ) {
          specificTechnology = "databases";
        } else if (
          responseLower.includes("web application") ||
          responseLower.includes("web app")
        ) {
          specificTechnology = "web applications";
        } else if (
          responseLower.includes("cloud") ||
          responseLower.includes("metadata")
        ) {
          specificTechnology = "cloud infrastructure";
        }

        // Extract CVE IDs
        const cveMatches = aiResponse.match(/CVE-\d{4}-\d+/g);
        const cveIds = cveMatches ? Array.from(new Set(cveMatches)) : [];

        // Create fallback tasks based on actual content
        const fallbackTasks = [
          {
            id: `todo-${Date.now()}-${vulnerabilityType.toLowerCase().replace(/\s+/g, "-")}-implement`,
            task: `🔧 Implement ${vulnerabilityType} vulnerability fixes`,
            priority: "high" as const,
            category: "Development",
            description: `Step-by-step implementation: 1) Analyze the ${vulnerabilityType} vulnerability in your codebase, 2) Identify vulnerable code patterns, 3) Implement secure coding practices, 4) Add input validation and sanitization, 5) Test the fixes thoroughly.`,
            completed: false,
            riskLevel: "high" as const,
            cvssScore: 8.0,
            confidence: 0.8,
            cveIds: cveIds,
            affectedSystems: ["Codebase", "Security Implementation"],
            emoji: "🔧",
            createdAt: Date.now(),
          },
          {
            id: `todo-${Date.now()}-${vulnerabilityType.toLowerCase().replace(/\s+/g, "-")}-test`,
            task: `🧪 Create comprehensive ${vulnerabilityType} test suite`,
            priority: "high" as const,
            category: "Testing",
            description: `Testing implementation: 1) Write unit tests that reproduce ${vulnerabilityType} scenarios, 2) Create integration tests for secure code paths, 3) Add automated security testing to CI/CD, 4) Test edge cases and boundary conditions, 5) Verify fixes work correctly.`,
            completed: false,
            riskLevel: "high" as const,
            cvssScore: 7.5,
            confidence: 0.85,
            cveIds: cveIds,
            affectedSystems: ["Testing Environment", "CI/CD Pipeline"],
            emoji: "🧪",
            createdAt: Date.now(),
          },
          {
            id: `todo-${Date.now()}-${vulnerabilityType.toLowerCase().replace(/\s+/g, "-")}-monitor`,
            task: `🔍 Implement ${vulnerabilityType} monitoring and alerting`,
            priority: "medium" as const,
            category: "Monitoring",
            description: `Monitoring setup: 1) Add logging for ${vulnerabilityType} attack patterns, 2) Configure alerts for suspicious activity, 3) Set up dashboards for security metrics, 4) Implement automated response procedures, 5) Monitor for exploitation attempts.`,
            completed: false,
            riskLevel: "medium" as const,
            cvssScore: 6.0,
            confidence: 0.75,
            cveIds: cveIds,
            affectedSystems: ["Production", "Monitoring Systems"],
            emoji: "🔍",
            createdAt: Date.now(),
          },
          {
            id: `todo-${Date.now()}-${vulnerabilityType.toLowerCase().replace(/\s+/g, "-")}-docs`,
            task: `📝 Document ${vulnerabilityType} security practices`,
            priority: "medium" as const,
            category: "Documentation",
            description: `Documentation tasks: 1) Create security implementation guide for ${vulnerabilityType}, 2) Document secure coding patterns, 3) Write team training materials, 4) Update security policies, 5) Create incident response procedures.`,
            completed: false,
            riskLevel: "medium" as const,
            cvssScore: 4.0,
            confidence: 0.7,
            cveIds: cveIds,
            affectedSystems: ["Documentation", "Team Training"],
            emoji: "📝",
            createdAt: Date.now(),
          },
        ];

        generatedTasks.push(...fallbackTasks);
        console.log(
          `✅ [TODO API] Added ${fallbackTasks.length} fallback tasks`
        );
      }

      // Create the TODO list
      const todoList: TodoList = {
        id: `todo-list-${Date.now()}`,
        title: "🔐 Security Action Items",
        description: "Generated actionable tasks based on security analysis",
        items: generatedTasks,
        createdAt: Date.now(),
        lastModified: Date.now(),
      };

      // Save to database
      await ctx.runMutation(api.todoApi.saveTodoList, {
        chatId,
        messageId,
        todoList,
      });

      console.log("✅ [TODO API] TODO list saved successfully");

      return {
        success: true,
        todoList: todoList,
        todoListId: todoList.id,
        itemsCount: generatedTasks.length,
        message: "TODO tasks generated successfully using AI analysis",
      };
    } catch (error) {
      console.error("❌ [TODO API] Error generating TODO tasks:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to generate TODO tasks",
      };
    }
  },
});

// Save TODO list
export const saveTodoList = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
    todoList: v.any(),
  },
  handler: async (ctx, args) => {
    const { chatId, messageId, todoList } = args;

    try {
      // Find the chat history entry for this message
      const chatHistoryEntry = await ctx.db
        .query("chatHistory")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("humanInTheLoopId"), messageId))
        .first();

      if (chatHistoryEntry) {
        // Update the chat history with the TODO list
        await ctx.db.patch(chatHistoryEntry._id, {
          todoList: todoList,
        });

        console.log("✅ [TODO API] Database save result:", {
          message: "TODO list updated successfully",
          success: true,
        });

        return { success: true, message: "TODO list updated successfully" };
      } else {
        console.error(
          "❌ [TODO API] Chat history entry not found for messageId:",
          messageId
        );
        return { success: false, message: "Chat history entry not found" };
      }
    } catch (error) {
      console.error("❌ [TODO API] Database save error:", error);
      return { success: false, message: "Failed to save TODO list" };
    }
  },
});

// Get TODO list from chat
export const getTodoListFromChat = query({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const { chatId, messageId } = args;

    try {
      // Find the chat history entry for this message
      const chatHistoryEntry = await ctx.db
        .query("chatHistory")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("humanInTheLoopId"), messageId))
        .first();

      if (!chatHistoryEntry) {
        return { success: false, message: "Chat history entry not found" };
      }

      const todoList = chatHistoryEntry.todoList;
      if (!todoList) {
        return {
          success: false,
          message: "No TODO list found for this message",
        };
      }

      return { success: true, todoList: todoList };
    } catch (error) {
      console.error("Error getting TODO list:", error);
      return { success: false, message: "Failed to get TODO list" };
    }
  },
});

// Sync TODO list from My Space back to main chat
export const syncTodoListFromMySpace = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.string(),
    todoListData: v.any(),
  },
  handler: async (ctx, args) => {
    const { chatId, messageId, todoListData } = args;

    try {
      // Find the chat history entry for this message
      const chatHistoryEntry = await ctx.db
        .query("chatHistory")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("humanInTheLoopId"), messageId))
        .first();

      if (chatHistoryEntry) {
        // Update the chat history with the synced TODO list
        await ctx.db.patch(chatHistoryEntry._id, {
          todoList: todoListData,
        });

        console.log(
          "✅ [TODO API] Synced TODO list from My Space to main chat"
        );
        return { success: true, message: "TODO list synced successfully" };
      } else {
        console.error("❌ [TODO API] Chat history entry not found for sync");
        return { success: false, message: "Chat history entry not found" };
      }
    } catch (error) {
      console.error("❌ [TODO API] Error syncing TODO list:", error);
      return { success: false, message: "Failed to sync TODO list" };
    }
  },
});
