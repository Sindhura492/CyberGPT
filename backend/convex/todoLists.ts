import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export interface TodoItem {
  id: string;
  task: string;
  priority: "high" | "medium" | "low";
  category: string;
  description?: string;
  completed: boolean;
  riskLevel: "critical" | "high" | "medium" | "low";
  cvssScore: number;
  confidence: number;
  cveIds?: string[];
  affectedSystems?: string[];
  remediationSteps?: string[];
}

export interface TodoList {
  id: string;
  title: string;
  description: string;
  items: TodoItem[];
  createdAt: Date;
  messageId: string;
  chatId: string;
  lastModified?: string;
}

// Save or update a TODO list
export const saveTodoList = mutation({
  args: {
    chatId: v.string(),
    messageId: v.string(),
    todoList: v.any(), // TodoList object
    lastModified: v.string(),
  },
  handler: async (ctx, args) => {
    const { chatId, messageId, todoList, lastModified } = args;

    try {
      // Check if TODO list already exists for this message
      const existingTodoList = await ctx.db
        .query("todoLists")
        .withIndex("by_message_chat", (q) =>
          q.eq("messageId", messageId).eq("chatId", chatId)
        )
        .first();

      if (existingTodoList) {
        // Update existing TODO list
        const updatedId = await ctx.db.patch(existingTodoList._id, {
          todoList: todoList,
          lastModified: lastModified,
          updatedAt: new Date(),
        });
        return { success: true, id: updatedId, action: "updated" };
      } else {
        // Create new TODO list
        const newId = await ctx.db.insert("todoLists", {
          chatId: chatId,
          messageId: messageId,
          todoList: todoList,
          lastModified: lastModified,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { success: true, id: newId, action: "created" };
      }
    } catch (error) {
      console.error("Error saving TODO list:", error);
      throw new Error("Failed to save TODO list");
    }
  },
});

// Get TODO list by message ID and chat ID
export const getTodoList = query({
  args: {
    messageId: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, chatId } = args;

    try {
      const todoList = await ctx.db
        .query("todoLists")
        .withIndex("by_message_chat", (q) =>
          q.eq("messageId", messageId).eq("chatId", chatId)
        )
        .first();

      return todoList ? todoList.todoList : null;
    } catch (error) {
      console.error("Error fetching TODO list:", error);
      return null;
    }
  },
});

// Get all TODO lists for a chat
export const getTodoListsByChat = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const { chatId } = args;

    try {
      const todoLists = await ctx.db
        .query("todoLists")
        .withIndex("by_chat", (q) => q.eq("chatId", chatId))
        .order("desc")
        .collect();

      return todoLists.map((tl) => ({
        id: tl._id,
        messageId: tl.messageId,
        todoList: tl.todoList,
        lastModified: tl.lastModified,
        createdAt: tl.createdAt,
        updatedAt: tl.updatedAt,
      }));
    } catch (error) {
      console.error("Error fetching TODO lists by chat:", error);
      return [];
    }
  },
});

// Delete TODO list
export const deleteTodoList = mutation({
  args: {
    messageId: v.string(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, chatId } = args;

    try {
      const existingTodoList = await ctx.db
        .query("todoLists")
        .withIndex("by_message_chat", (q) =>
          q.eq("messageId", messageId).eq("chatId", chatId)
        )
        .first();

      if (existingTodoList) {
        await ctx.db.delete(existingTodoList._id);
        return { success: true, action: "deleted" };
      } else {
        return { success: false, action: "not_found" };
      }
    } catch (error) {
      console.error("Error deleting TODO list:", error);
      throw new Error("Failed to delete TODO list");
    }
  },
});
