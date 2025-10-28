import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createReportFolder = mutation({
  args: {
    userId: v.string(), // External user ID
    folderName: v.string(),
  },
  handler: async (ctx, { userId, folderName }) => {
    const now = Date.now();

    // Insert a new report folder
    const folderId = await ctx.db.insert("reportFolders", {
      userId,
      folderName,
      createdAt: now,
    });

    return folderId;
  },
});

// Save TODO list to a folder
export const saveTodoListToFolder = mutation({
  args: {
    folderId: v.id("reportFolders"),
    todoListName: v.string(),
    todoListData: v.any(), // The complete TODO list object
    markdownContent: v.string(), // Converted markdown content for display
    chatId: v.optional(v.string()), // Chat ID for syncing back to main chat
    messageId: v.optional(v.string()), // Message ID for syncing back to main chat
  },
  handler: async (
    ctx,
    { folderId, todoListName, todoListData, markdownContent, chatId, messageId }
  ) => {
    const now = Date.now();

    // Save TODO list as a report
    const reportId = await ctx.db.insert("reports", {
      folderId,
      fileName: todoListName,
      fileUrl: "", // Not needed for TODO lists
      markdownContent,
      reportType: "vulnerabilityTodo", // Use vulnerability todo type for TODO lists
      todoListData, // Store the complete TODO list data for interactive editing
      chatId, // Store chat ID for syncing
      messageId, // Store message ID for syncing
      createdAt: now,
    });

    return reportId;
  },
});

// Update TODO list data for interactive editing
export const updateTodoListData = mutation({
  args: {
    reportId: v.id("reports"),
    todoListData: v.any(), // Updated TODO list data
    markdownContent: v.string(), // Updated markdown content
  },
  handler: async (ctx, { reportId, todoListData, markdownContent }) => {
    await ctx.db.patch(reportId, {
      todoListData,
      markdownContent,
    });

    return {
      success: true,
      message: "TODO list updated successfully",
    };
  },
});

export const getReportFoldersByUser = query({
  args: {
    userId: v.string(), // External user ID
  },
  handler: async (ctx, { userId }) => {
    // Query reportFolders table by userId
    const folders = await ctx.db
      .query("reportFolders")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    return folders;
  },
});

export const addReport = mutation({
  args: {
    folderId: v.id("reportFolders"), // ID of the report folder
    fileName: v.string(),
    fileUrl: v.string(),
    markdownContent: v.any(),
    reportType: v.optional(
      v.union(v.literal("chatSummaryReport"), v.literal("vulnerabilityReport"))
    ),
  },
  handler: async (
    ctx,
    { folderId, fileName, fileUrl, markdownContent, reportType }
  ) => {
    const now = Date.now();

    // Insert a new report into the reports table
    const reportId = await ctx.db.insert("reports", {
      folderId,
      fileName,
      fileUrl,
      markdownContent, // Empty content for now
      reportType: reportType || undefined,
      createdAt: now,
    });

    return reportId;
  },
});

export const getReportsByFolder = query({
  args: {
    folderId: v.optional(v.id("reportFolders")),
  },
  handler: async (ctx, { folderId }) => {
    // Query reports table by folderId
    if (folderId) {
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
        .collect();

      // Sort by createdAt in descending order (latest first)
      return reports.sort((a, b) => b.createdAt - a.createdAt);
    }
    return [];
  },
});

export const getFileById = query({
  args: {
    fileId: v.id("reports"),
  },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file) {
      return null;
    }
    return file;
  },
});

export const deleteReport = mutation({
  args: {
    reportId: v.id("reports"), // ID of the report to delete
  },
  handler: async (ctx, { reportId }) => {
    // Delete the report by its ID
    const deleted = await ctx.db.delete(reportId);
    return {
      success: true,
      message: "Report deleted successfully.",
    };
  },
});

export const deleteReportFolder = mutation({
  args: {
    folderId: v.id("reportFolders"), // ID of the folder to delete
  },
  handler: async (ctx, { folderId }) => {
    // Step 1: Fetch all reports associated with the folder
    const reportsInFolder = await ctx.db
      .query("reports")
      .withIndex("by_folderId", (q) => q.eq("folderId", folderId))
      .collect();

    // Step 2: Delete all the reports in the folder
    for (const report of reportsInFolder) {
      await ctx.db.delete(report._id);
    }

    // Step 3: Delete the folder itself
    await ctx.db.delete(folderId);

    return {
      success: true,
      message: "Folder and all related reports deleted successfully.",
    };
  },
});
