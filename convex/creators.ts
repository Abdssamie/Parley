import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("collected"),
        v.literal("in_outreach"),
        v.literal("negotiating"),
        v.literal("contracted"),
        v.literal("declined")
      )
    ),
    platform: v.optional(
      v.union(
        v.literal("youtube"),
        v.literal("twitter"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("substack"),
        v.literal("linkedin"),
        v.literal("twitch")
      )
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let creators: Doc<"creators">[];

    if (args.status) {
      creators = await ctx.db
        .query("creators")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(100);
    } else if (args.platform) {
      creators = await ctx.db
        .query("creators")
        .withIndex("by_platform", (q) => q.eq("platform", args.platform!))
        .order("desc")
        .take(100);
    } else {
      creators = await ctx.db
        .query("creators")
        .withIndex("by_created_at")
        .order("desc")
        .take(100);
    }

    if (args.search) {
      const q = args.search.toLowerCase();
      return creators.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.audienceNiche.toLowerCase().includes(q) ||
          (c.country && c.country.toLowerCase().includes(q))
      );
    }

    return creators;
  },
});

export const get = query({
  args: { id: v.id("creators") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    return creator;
  },
});

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("creators").take(500);
    const totalCount = all.length;
    let totalFollowers = 0;
    let totalViews = 0;
    let totalEstCost = 0;
    let costCount = 0;

    const statusCounts = {
      collected: 0,
      in_outreach: 0,
      negotiating: 0,
      contracted: 0,
      declined: 0,
    };

    for (const c of all) {
      if (c.followers) totalFollowers += c.followers;
      if (c.views) totalViews += c.views;
      if (c.estCost) {
        totalEstCost += c.estCost;
        costCount += 1;
      }
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status] += 1;
      }
    }

    const avgCost = costCount > 0 ? Math.round(totalEstCost / costCount) : 0;

    return {
      totalCount,
      totalFollowers,
      totalViews,
      avgCost,
      statusCounts,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    status: v.optional(
      v.union(
        v.literal("collected"),
        v.literal("in_outreach"),
        v.literal("negotiating"),
        v.literal("contracted"),
        v.literal("declined")
      )
    ),
    platform: v.optional(
      v.union(
        v.literal("youtube"),
        v.literal("twitter"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("substack"),
        v.literal("linkedin"),
        v.literal("twitch")
      )
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("creators", {
      name: args.name,
      status: args.status ?? "collected",
      platform: args.platform ?? "youtube",
      email: args.email,
      country: args.country,
      followers: args.followers,
      views: args.views,
      engagementRate: args.engagementRate,
      estCost: args.estCost,
      bioLink: args.bioLink,
      audienceNiche: args.audienceNiche,
      brandFitScore: args.brandFitScore,
      scrapedSummary: args.scrapedSummary,
      pastSponsors: args.pastSponsors,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("creators"),
    name: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("collected"),
        v.literal("in_outreach"),
        v.literal("negotiating"),
        v.literal("contracted"),
        v.literal("declined")
      )
    ),
    platform: v.optional(
      v.union(
        v.literal("youtube"),
        v.literal("twitter"),
        v.literal("instagram"),
        v.literal("tiktok"),
        v.literal("substack"),
        v.literal("linkedin"),
        v.literal("twitch")
      )
    ),
    email: v.optional(v.string()),
    country: v.optional(v.string()),
    followers: v.optional(v.number()),
    views: v.optional(v.number()),
    engagementRate: v.optional(v.number()),
    estCost: v.optional(v.number()),
    bioLink: v.optional(v.string()),
    audienceNiche: v.optional(v.string()),
    brandFitScore: v.optional(v.number()),
    scrapedSummary: v.optional(v.string()),
    pastSponsors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const cleanFields = Object.fromEntries(
      Object.entries(fields).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanFields);
    return id;
  },
});

export const batchUpdateStatus = mutation({
  args: {
    ids: v.array(v.id("creators")),
    status: v.union(
      v.literal("collected"),
      v.literal("in_outreach"),
      v.literal("negotiating"),
      v.literal("contracted"),
      v.literal("declined")
    ),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { status: args.status });
    }
    return { success: true, count: args.ids.length };
  },
});

export const remove = mutation({
  args: { id: v.id("creators") },
  handler: async (ctx, args) => {
    // Delete associated threads and messages
    const threads = await ctx.db
      .query("threads")
      .withIndex("by_creator", (q) => q.eq("creatorId", args.id))
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
