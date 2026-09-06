import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  campaigns: defineTable({
    title: v.string(),
    budgetCap: v.number(),
    targetNiche: v.string(),
    deliverableRequirements: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("completed")),
    createdAt: v.number(),
  }),

  creators: defineTable({
    name: v.string(),
    bioLink: v.string(),
    contactEmail: v.string(),
    audienceNiche: v.string(),
    brandFitScore: v.number(),
    scrapedSummary: v.string(),
    pastSponsors: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

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
});
