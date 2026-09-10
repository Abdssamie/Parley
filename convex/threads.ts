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
      v.literal("review_required"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("ghosted")
    ),
    proposedFee: v.optional(v.number()),
    ruleTriggered: v.optional(
      v.union(
        v.literal("rule_a"),
        v.literal("rule_b"),
        v.literal("rule_c"),
        v.literal("rule_d")
      )
    ),
    contractLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      stage:
        | "discovered"
        | "pitched"
        | "negotiating"
        | "review_required"
        | "accepted"
        | "declined"
        | "ghosted";
      lastActivityAt: number;
      proposedFee?: number;
      ruleTriggered?: "rule_a" | "rule_b" | "rule_c" | "rule_d";
      contractLink?: string;
    } = {
      stage: args.stage,
      lastActivityAt: Date.now(),
    };
    if (args.proposedFee !== undefined) {
      patch.proposedFee = args.proposedFee;
    }
    if (args.ruleTriggered !== undefined) {
      patch.ruleTriggered = args.ruleTriggered;
    }
    if (args.contractLink !== undefined) {
      patch.contractLink = args.contractLink;
    }
    await ctx.db.patch(args.id, patch);
  },
});

export const approveDraftCounter = mutation({
  args: {
    threadId: v.id("threads"),
    customBody: v.optional(v.string()),
    customFee: v.optional(v.number()),
    advanceStage: v.optional(
      v.union(v.literal("negotiating"), v.literal("accepted"))
    ),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const messageBody = args.customBody || thread.draftCounterOffer;
    if (!messageBody) {
      throw new Error("No draft message available to approve");
    }

    const campaign = await ctx.db.get(thread.campaignId);
    const targetFee = args.customFee ?? thread.proposedFee;
    const targetStage = args.advanceStage ?? "negotiating";

    // Record outbound agent message
    await ctx.db.insert("messages", {
      threadId: thread._id,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: Date.now(),
      extractedIntent: "counter_offer_approved",
      subject: `Re: Partnership Collaboration - ${campaign?.title ?? "Campaign"}`,
      rawBody: messageBody,
    });

    // Clear draft and approval flag, advance stage
    await ctx.db.patch(thread._id, {
      pendingApproval: false,
      draftCounterOffer: undefined,
      stage: targetStage,
      proposedFee: targetFee,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

export const walkAwayThread = mutation({
  args: {
    threadId: v.id("threads"),
    signOffMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) throw new Error("Thread not found");
    const campaign = await ctx.db.get(thread.campaignId);

    const body =
      args.signOffMessage ||
      `Thank you for your response. Unfortunately, we cannot accommodate this rate for this milestone and will be passing on this collaboration. Best of luck with your content!`;

    await ctx.db.insert("messages", {
      threadId: thread._id,
      sender: "human_reviewer",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: Date.now(),
      extractedIntent: "decline_walkaway",
      subject: `Re: Partnership Collaboration - ${campaign?.title ?? "Campaign"}`,
      rawBody: body,
    });

    await ctx.db.patch(thread._id, {
      stage: "declined",
      pendingApproval: false,
      draftCounterOffer: undefined,
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
        v.literal("review_required"),
        v.literal("accepted"),
        v.literal("declined"),
        v.literal("ghosted")
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
      stage?:
        | "discovered"
        | "pitched"
        | "negotiating"
        | "review_required"
        | "accepted"
        | "declined"
        | "ghosted";
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
    stage: v.optional(
      v.union(
        v.literal("negotiating"),
        v.literal("review_required"),
        v.literal("accepted"),
        v.literal("declined")
      )
    ),
    ruleTriggered: v.optional(
      v.union(
        v.literal("rule_a"),
        v.literal("rule_b"),
        v.literal("rule_c"),
        v.literal("rule_d")
      )
    ),
    sentimentScore: v.optional(v.number()),
    requestedRate: v.optional(v.number()),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      stage: args.stage ?? "review_required",
      pendingApproval: true,
      draftCounterOffer: args.draftCounterOffer,
      proposedFee: args.proposedFee,
      requestedRate: args.requestedRate,
      ruleTriggered: args.ruleTriggered ?? "rule_c",
      sentimentScore: args.sentimentScore,
      reasoning: args.reasoning,
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

export const checkAndFlagGhostedThreads = mutation({
  args: {
    thresholdDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.thresholdDays ?? 5;
    const cutoff = Date.now() - days * 86400000;
    const candidates = await ctx.db.query("threads").collect();
    let ghostedCount = 0;
    for (const t of candidates) {
      if (
        (t.stage === "pitched" || t.stage === "negotiating") &&
        t.lastActivityAt < cutoff
      ) {
        await ctx.db.patch(t._id, {
          stage: "ghosted",
          lastActivityAt: Date.now(),
        });
        ghostedCount++;
      }
    }
    return { ghostedCount };
  },
});


