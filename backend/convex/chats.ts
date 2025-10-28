import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save a Chat Message
export const saveChatMessage = mutation({
  args: {
    chatId: v.id("chats"),
    humanInTheLoopId: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    message: v.string(),
  },
  handler: async (ctx, { chatId, humanInTheLoopId, sender, message }) => {
    const now = Date.now();
    const result = await ctx.db.insert("chatHistory", {
      chatId,
      humanInTheLoopId,
      sender,
      message,
      createdAt: now,
      tags: [], // Required field, default to empty array
    });

    await ctx.db.patch(chatId, { updatedAt: now });

    return result;
  },
});

// Save Enhanced Chat Message with AI Response Data and Graph Visualization
export const saveEnhancedChatMessage = mutation({
  args: {
    chatId: v.id("chats"),
    humanInTheLoopId: v.string(),
    sender: v.union(v.literal("user"), v.literal("ai")),
    message: v.string(),
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
    tags: v.optional(v.array(v.string())),
    graphVisualization: v.optional(v.any()), // Add graph visualization data
  },
  handler: async (
    ctx,
    {
      chatId,
      humanInTheLoopId,
      sender,
      message,
      Answer,
      Reasoning,
      Sources,
      SourceLinks,
      Jargons,
      Info,
      Severity,
      tags,
      graphVisualization,
    }
  ) => {
    console.log("saveEnhancedChatMessage called with:", {
      sender,
      hasAnswer: !!Answer,
      hasJargons: !!Jargons,
      hasInfo: !!Info,
      hasReasoning: !!Reasoning,
      jargonsKeys: Jargons ? Object.keys(Jargons) : [],
      hasGraphVisualization: !!graphVisualization,
      graphVisualizationKeys: graphVisualization
        ? Object.keys(graphVisualization)
        : [],
    });
    const now = Date.now();
    // Ensure Reasoning is always a string (narrative)
    let reasoningString =
      typeof Reasoning === "string"
        ? Reasoning
        : Array.isArray(Reasoning) && Reasoning[0]?.narrative
          ? Reasoning[0].narrative
          : Reasoning && typeof Reasoning.narrative === "string"
            ? Reasoning.narrative
            : undefined;
    console.log("📊 [Convex] Storing chat message with graph visualization:", {
      messageId: humanInTheLoopId,
      chatId,
      sender,
      messageLength: message.length,
      hasGraphVisualization: !!graphVisualization,
      graphVisualizationSummary: graphVisualization
        ? {
            vulnerabilities: graphVisualization.vulnerabilities?.length || 0,
            mitigations: graphVisualization.mitigations?.length || 0,
            sources: graphVisualization.sources?.length || 0,
            cves: graphVisualization.cves?.length || 0,
            problems: graphVisualization.problems?.length || 0,
            affected: graphVisualization.affected?.length || 0,
            risks: graphVisualization.risks?.length || 0,
            relationships: graphVisualization.relationships?.length || 0,
          }
        : "No graph data",
    });

    // Prepare the insert data, only including graphVisualization if it's valid
    const insertData: any = {
      chatId,
      humanInTheLoopId,
      sender,
      message,
      createdAt: now,
      Answer,
      Reasoning: reasoningString,
      Sources,
      SourceLinks,
      Jargons,
      Info,
      Severity,
      tags: tags || [], // Default to empty array if not provided
    };

    // Only include graphVisualization if it's not null/undefined and has content
    if (
      graphVisualization &&
      typeof graphVisualization === "object" &&
      Object.keys(graphVisualization).length > 0
    ) {
      insertData.graphVisualization = graphVisualization;
    }

    const result = await ctx.db.insert("chatHistory", insertData);

    console.log(
      "✅ [Convex] Chat message stored successfully with graph visualization:",
      {
        messageId: humanInTheLoopId,
        databaseId: result,
        hasGraphVisualization: !!graphVisualization,
      }
    );

    await ctx.db.patch(chatId, { updatedAt: now });

    return result;
  },
});

// Get Chat History
export const getChatHistory = query({
  args: { chatId: v.optional(v.id("chats")) },
  handler: async (ctx, { chatId }) => {
    if (chatId) {
      const chatHistory = await ctx.db
        .query("chatHistory")
        .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
        .collect();

      return chatHistory;
    }
    return [];
  },
});

// Save a Chat
export const saveChat = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { userId, title, tags = [] }) => {
    const now = Date.now();

    const chatId = await ctx.db.insert("chats", {
      userId,
      title,
      tags,
      createdAt: now,
      updatedAt: now,
    });

    return chatId;
  },
});

// Get chats by userId
export const getChatsByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return chats;
  },
});

// Delete a specific Chat and its History
export const deleteChatById = mutation({
  args: {
    chatId: v.id("chats"), // The chat ID to delete
  },
  handler: async (ctx, { chatId }) => {
    // Fetch all chat history entries for the given chatId
    const chatHistory = await ctx.db
      .query("chatHistory")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .collect();

    // Delete each message in the chat history
    for (const message of chatHistory) {
      await ctx.db.delete(message._id); // Delete message
    }

    // Delete the chat itself
    await ctx.db.delete(chatId);

    return {
      success: true,
      message: "Chat and its history deleted successfully",
    };
  },
});

export const validateChatId = query({
  args: {
    chatId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { chatId, userId }): Promise<boolean> => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("_id"), chatId))
      .first();

    return chat !== null;
  },
});

export const getAllUserChatMessages = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Get all chats for the user
    const userChats = await ctx.db
      .query("chats")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all messages for these chats
    const allMessages = [];
    for (const chat of userChats) {
      const messages = await ctx.db
        .query("chatHistory")
        .withIndex("by_chatId", (q) => q.eq("chatId", chat._id))
        .collect();
      allMessages.push(...messages);
    }

    return allMessages;
  },
});
