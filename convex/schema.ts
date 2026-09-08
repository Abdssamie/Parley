import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campaigns: defineTable({
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("planning"),
      v.literal("paused"),
      v.literal("completed")
    ),
    budget: v.number(),
    currency: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    brief: v.string(),
    targetNiche: v.string(),
    deliverableRequirements: v.string(),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  creators: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("collected"),
      v.literal("in_outreach"),
      v.literal("negotiating"),
      v.literal("contracted"),
      v.literal("declined")
    ),
    platform: v.union(
      v.literal("youtube"),
      v.literal("twitter"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("substack"),
      v.literal("linkedin"),
      v.literal("twitch")
    ),
    email: v.string(),
    country: v.optional(v.string()),
    followers: v.optional(v.number()),
    views: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    estCost: v.optional(v.number()),
    bioLink: v.string(),
    audienceNiche: v.string(),
    brandFitScore: v.number(),
    scrapedSummary: v.string(),
    pastSponsors: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_platform", ["platform"])
    .index("by_created_at", ["createdAt"]),

  threads: defineTable({
    creatorId: v.id("creators"),
    campaignId: v.id("campaigns"),
    agentMailThreadId: v.string(),
    stage: v.union(
      v.literal("discovered"),
      v.literal("pitched"),
      v.literal("negotiating"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    proposedFee: v.number(),
    agreedDeliverables: v.string(),
    humanOverride: v.boolean(),
    pendingApproval: v.boolean(),
    draftCounterOffer: v.optional(v.string()),
    agentComponentThreadId: v.optional(v.string()),
    lastActivityAt: v.number(),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_stage", ["stage"])
    .index("by_creator", ["creatorId"])
    .index("by_agentmail_thread", ["agentMailThreadId"]),

  messages: defineTable({
    threadId: v.id("threads"),
    sender: v.union(
      v.literal("agent"),
      v.literal("creator"),
      v.literal("human_reviewer")
    ),
    senderAddress: v.string(),
    timestamp: v.number(),
    extractedIntent: v.string(),
    subject: v.string(),
    rawBody: v.string(),
  }).index("by_thread", ["threadId"]),

  emailTemplates: defineTable({
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: v.union(
      v.literal("pitch"),
      v.literal("negotiation"),
      v.literal("followup"),
      v.literal("contract")
    ),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_created_at", ["createdAt"]),
});
