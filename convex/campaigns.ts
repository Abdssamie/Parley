import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("planning"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let campaigns = args.status
      ? await ctx.db
          .query("campaigns")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(100)
      : await ctx.db
          .query("campaigns")
          .withIndex("by_created_at")
          .order("desc")
          .take(100);

    if (args.search) {
      const q = args.search.toLowerCase();
      campaigns = campaigns.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.brief.toLowerCase().includes(q) ||
          c.targetNiche.toLowerCase().includes(q)
      );
    }

    return campaigns;
  },
});

export const get = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    budget: v.number(),
    currency: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    brief: v.string(),
    targetNiche: v.string(),
    deliverableRequirements: v.string(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("planning"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("campaigns", {
      title: args.title,
      budget: args.budget,
      currency: args.currency,
      startDate: args.startDate,
      endDate: args.endDate,
      brief: args.brief,
      targetNiche: args.targetNiche,
      deliverableRequirements: args.deliverableRequirements,
      status: args.status ?? "active",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("campaigns"),
    title: v.optional(v.string()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    brief: v.optional(v.string()),
    targetNiche: v.optional(v.string()),
    deliverableRequirements: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("planning"),
        v.literal("paused"),
        v.literal("completed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    // Delete associated threads and messages
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.id))
      .collect();

    for (const thread of threads) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
        .collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      await ctx.db.delete(thread._id);
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getMetrics = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    const threads = args.campaignId
      ? await ctx.db
          .query("threads")
          .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
          .collect()
      : await ctx.db.query("threads").collect();

    const creators = await ctx.db.query("creators").collect();
    const campaigns = await ctx.db.query("campaigns").collect();

    const stageCounts = {
      discovered: 0,
      pitched: 0,
      negotiating: 0,
      accepted: 0,
      declined: 0,
    };

    let totalCommittedSpend = 0;
    let pendingApprovals = 0;

    for (const thread of threads) {
      stageCounts[thread.stage] = (stageCounts[thread.stage] || 0) + 1;
      if (thread.stage === "accepted") {
        totalCommittedSpend += thread.proposedFee;
      }
      if (thread.pendingApproval) {
        pendingApprovals += 1;
      }
    }

    return {
      totalCampaigns: campaigns.length,
      totalCreators: creators.length,
      totalThreads: threads.length,
      stageCounts,
      totalCommittedSpend,
      pendingApprovals,
    };
  },
});
