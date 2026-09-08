import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const categoryValidator = v.union(
  v.literal("pitch"),
  v.literal("negotiation"),
  v.literal("followup"),
  v.literal("contract")
);

export const list = query({
  args: {
    category: v.optional(categoryValidator),
  },
  handler: async (ctx, args) => {
    let templatesQuery;
    if (args.category) {
      templatesQuery = ctx.db
        .query("emailTemplates")
        .withIndex("by_category", (q) => q.eq("category", args.category!));
    } else {
      templatesQuery = ctx.db
        .query("emailTemplates")
        .withIndex("by_created_at");
    }

    const templates = await templatesQuery.order("desc").collect();
    return templates;
  },
});

export const get = query({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const statusValidator = v.union(v.literal("active"), v.literal("inactive"));

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: categoryValidator,
    status: v.optional(statusValidator),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const templateId = await ctx.db.insert("emailTemplates", {
      name: args.name,
      subject: args.subject,
      body: args.body,
      category: args.category,
      status: args.status ?? "active",
      description: args.description,
      isDefault: args.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    });
    return templateId;
  },
});

export const update = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.string(),
    subject: v.string(),
    body: v.string(),
    category: categoryValidator,
    status: v.optional(statusValidator),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Template ${args.id} not found`);
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      subject: args.subject,
      body: args.body,
      category: args.category,
      status: args.status ?? existing.status ?? "active",
      description: args.description,
      updatedAt: Date.now(),
    });
    return args.id;
  },
});

export const toggleStatus = mutation({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error(`Template ${args.id} not found`);
    }
    const newStatus = existing.status === "inactive" ? "active" : "inactive";
    await ctx.db.patch(args.id, {
      status: newStatus,
      updatedAt: Date.now(),
    });
    return newStatus;
  },
});

export const remove = mutation({
  args: {
    id: v.id("emailTemplates"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("emailTemplates").first();
    if (existing) {
      return { seeded: false, count: 0 };
    }

    const now = Date.now();
    const defaultTemplates = [
      {
        name: "Initial Creator Outreach Pitch",
        category: "pitch" as const,
        description: "Personalized cold pitch highlighting audience alignment and campaign brief.",
        subject: "Paid Partnership: {{campaign.title}} x {{creator.name}}",
        body: `Hi {{creator.name}},

I've been following your work on {{creator.platform}} and love how you cover {{creator.niche}}. Your engagement with your community really stands out.

We are currently launching a campaign for {{campaign.title}} and would love to partner with you. 

Here is a quick overview of what we're planning:
- Campaign: {{campaign.title}}
- Deliverables: {{campaign.deliverables}}
- Target Audience: {{campaign.targetNiche}}
- Proposed Fee: {{creator.rate}}

Brief Summary:
{{campaign.brief}}

Are you open to collaborations this month? If your schedule permits, let me know your media kit and updated rate card, or if our proposed fee of {{creator.rate}} works for you.

Looking forward to hearing your thoughts!

Best regards,
{{sender.name}}
{{brand.name}} Team`,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Negotiation Counter-Offer",
        category: "negotiation" as const,
        description: "Constructive counter-proposal aligned with campaign budget and deliverables.",
        subject: "Re: Partnership Rate Alignment - {{campaign.title}} x {{creator.name}}",
        body: `Hi {{creator.name}},

Thanks so much for getting back to us and sharing your rate.

We really want to make this collaboration work given how strong your brand fit is for {{campaign.title}}. However, our budget ceiling for this activation tier is {{creator.rate}} for {{campaign.deliverables}}.

Could we find a middle ground at {{creator.rate}}? Alternatively, if that is too tight, we can adjust the deliverables to better match your standard packages.

Let us know if this works so we can lock in the agreement and send over the creative brief.

Best,
{{sender.name}}`,
        isDefault: true,
        createdAt: now + 1,
        updatedAt: now + 1,
      },
      {
        name: "Follow-Up Reminder",
        category: "followup" as const,
        description: "Friendly nudge for creators who haven't responded within 3-4 business days.",
        subject: "Checking in: {{campaign.title}} collaboration for {{creator.name}}",
        body: `Hi {{creator.name}},

Just bumping this up in your inbox in case it slipped through! 

We're finalizing creator spots for {{campaign.title}} and would love to include you for {{campaign.deliverables}}.

Whenever you have a moment, please let me know if you'd like to move forward. Happy to answer any questions or share more details about the campaign.

Best regards,
{{sender.name}}`,
        isDefault: true,
        createdAt: now + 2,
        updatedAt: now + 2,
      },
      {
        name: "Partnership Agreement & Scope Confirmation",
        category: "contract" as const,
        description: "Official confirmation upon reaching an agreed fee and deliverables schedule.",
        subject: "Confirmed: Scope & Agreement for {{campaign.title}} x {{creator.name}}",
        body: `Hi {{creator.name}},

Excited to confirm we are locked in for the {{campaign.title}} campaign!

Here is the agreed scope summary:
- Creator: {{creator.name}} ({{creator.platform}})
- Agreed Deliverables: {{campaign.deliverables}}
- Agreed Compensation: {{creator.rate}}
- Campaign Dates: {{campaign.startDate}} - {{campaign.endDate}}

Next Steps:
1. Please review the attached agreement and creative guidelines.
2. Reply with your preferred payment details and tax forms.
3. First draft submission date: {{campaign.startDate}}.

Thrilled to work together on this!

Best regards,
{{sender.name}}
{{brand.name}}`,
        isDefault: true,
        createdAt: now + 3,
        updatedAt: now + 3,
      },
    ];

    for (const t of defaultTemplates) {
      await ctx.db.insert("emailTemplates", t);
    }

    return { seeded: true, count: defaultTemplates.length };
  },
});
