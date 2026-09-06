import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").order("desc").collect();
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
    budgetCap: v.number(),
    targetNiche: v.string(),
    deliverableRequirements: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("campaigns", {
      title: args.title,
      budgetCap: args.budgetCap,
      targetNiche: args.targetNiche,
      deliverableRequirements: args.deliverableRequirements,
      status: "active",
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("campaigns"),
    title: v.optional(v.string()),
    budgetCap: v.optional(v.number()),
    targetNiche: v.optional(v.string()),
    deliverableRequirements: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("paused"), v.literal("completed"))
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
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
