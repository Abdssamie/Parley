import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByThread = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();
  },
});

export const addMessage = mutation({
  args: {
    threadId: v.id("threads"),
    sender: v.union(
      v.literal("agent"),
      v.literal("creator"),
      v.literal("human_reviewer")
    ),
    senderAddress: v.string(),
    extractedIntent: v.string(),
    subject: v.string(),
    rawBody: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.threadId, {
      lastActivityAt: Date.now(),
    });

    return messageId;
  },
});
