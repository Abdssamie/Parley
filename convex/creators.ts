import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("creators").order("desc").collect();
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
    return await ctx.db
      .query("creators")
      .filter((q) => q.eq(q.field("contactEmail"), args.email))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    bioLink: v.string(),
    contactEmail: v.string(),
    audienceNiche: v.string(),
    brandFitScore: v.number(),
    scrapedSummary: v.string(),
    pastSponsors: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("creators", {
      ...args,
      createdAt: Date.now(),
    });
    return id;
  },
});
