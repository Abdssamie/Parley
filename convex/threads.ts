import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByCampaign = query({
  args: { campaignId: v.optional(v.id("campaigns")) },
  handler: async (ctx, args) => {
    const rawThreads = args.campaignId
      ? await ctx.db
          .query("threads")
          .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId!))
          .collect()
      : await ctx.db.query("threads").collect();

    // Enrich with creator information
    const enriched = await Promise.all(
      rawThreads.map(async (t) => {
        const creator = await ctx.db.get(t.creatorId);
        const campaign = await ctx.db.get(t.campaignId);
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_thread", (q) => q.eq("threadId", t._id))
          .order("desc")
          .first();

        return {
          ...t,
          creator,
          campaign,
          lastMessage,
        };
      })
    );

    // Sort by last activity descending
    return enriched.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  },
});

export const get = query({
  args: { id: v.id("threads") },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.id);
    if (!thread) return null;

    const creator = await ctx.db.get(thread.creatorId);
    const campaign = await ctx.db.get(thread.campaignId);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
      .order("asc")
      .collect();

    return {
      ...thread,
      creator,
      campaign,
      messages,
    };
  },
});

export const getByAgentMailThreadId = query({
  args: { agentMailThreadId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_agentmail_thread", (q) =>
        q.eq("agentMailThreadId", args.agentMailThreadId)
      )
      .first();
  },
});

export const getByCreatorId = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.creatorId))
      .first();
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("threads"),
    stage: v.union(
      v.literal("discovered"),
      v.literal("pitched"),
      v.literal("negotiating"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    proposedFee: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: {
      stage: "discovered" | "pitched" | "negotiating" | "accepted" | "declined";
      lastActivityAt: number;
      proposedFee?: number;
    } = {
      stage: args.stage,
      lastActivityAt: Date.now(),
    };
    if (args.proposedFee !== undefined) {
      patch.proposedFee = args.proposedFee;
    }
    await ctx.db.patch(args.id, patch);
  },
});

export const approveDraftCounter = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread || !thread.draftCounterOffer) {
      throw new Error("Thread or draft counter-offer not found");
    }

    const campaign = await ctx.db.get(thread.campaignId);

    // Record outbound agent message
    await ctx.db.insert("messages", {
      threadId: thread._id,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: Date.now(),
      extractedIntent: "counter_offer_approved",
      subject: `Re: Partnership Collaboration - ${campaign?.title ?? "Campaign"}`,
      rawBody: thread.draftCounterOffer,
    });

    // Clear draft and approval flag, advance stage
    await ctx.db.patch(thread._id, {
      pendingApproval: false,
      draftCounterOffer: undefined,
      stage: "negotiating",
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

export const submitHumanMessage = mutation({
  args: {
    threadId: v.id("threads"),
    subject: v.string(),
    body: v.string(),
    proposedFee: v.optional(v.number()),
    stage: v.optional(
      v.union(
        v.literal("discovered"),
        v.literal("pitched"),
        v.literal("negotiating"),
        v.literal("accepted"),
        v.literal("declined")
      )
    ),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");

    await ctx.db.insert("messages", {
      threadId: thread._id,
      sender: "human_reviewer",
      senderAddress: "marketing-lead@company.com",
      timestamp: Date.now(),
      extractedIntent: "manual_override_reply",
      subject: args.subject,
      rawBody: args.body,
    });

    const patch: {
      humanOverride: boolean;
      pendingApproval: boolean;
      draftCounterOffer: undefined;
      lastActivityAt: number;
      proposedFee?: number;
      stage?: "discovered" | "pitched" | "negotiating" | "accepted" | "declined";
    } = {
      humanOverride: true,
      pendingApproval: false,
      draftCounterOffer: undefined,
      lastActivityAt: Date.now(),
    };

    if (args.proposedFee !== undefined) {
      patch.proposedFee = args.proposedFee;
    }
    if (args.stage) {
      patch.stage = args.stage;
    }

    await ctx.db.patch(thread._id, patch);
    return { success: true };
  },
});

export const createInitialThread = mutation({
  args: {
    creatorId: v.id("creators"),
    campaignId: v.id("campaigns"),
    agentMailThreadId: v.string(),
    proposedFee: v.number(),
    agreedDeliverables: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("threads", {
      creatorId: args.creatorId,
      campaignId: args.campaignId,
      agentMailThreadId: args.agentMailThreadId,
      stage: "pitched",
      proposedFee: args.proposedFee,
      agreedDeliverables: args.agreedDeliverables,
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: Date.now(),
    });
  },
});

export const flagForHumanApproval = mutation({
  args: {
    threadId: v.id("threads"),
    draftCounterOffer: v.string(),
    proposedFee: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      stage: "negotiating",
      pendingApproval: true,
      draftCounterOffer: args.draftCounterOffer,
      proposedFee: args.proposedFee,
      lastActivityAt: Date.now(),
    });
  },
});

export const setAgentComponentThreadId = mutation({
  args: {
    threadId: v.id("threads"),
    agentComponentThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      agentComponentThreadId: args.agentComponentThreadId,
    });
  },
});


