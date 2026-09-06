import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import { crawlCreatorProfile } from "./integrations/firecrawl";
import { sendAgentMail } from "./integrations/agentmail";
import { analyzeAndDraftNegotiation } from "./integrations/openai";

export const autonomousResearchAndPitch = action({
  args: {
    campaignId: v.id("campaigns"),
    creatorUrl: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; creatorId: Id<"creators">; threadId: Id<"threads"> }> => {
    // 1. Fetch Campaign
    const campaign: Doc<"campaigns"> | null = await ctx.runQuery(api.campaigns.get, {
      id: args.campaignId,
    });
    if (!campaign) throw new Error("Campaign not found");

    // 2. Firecrawl Scraping
    const crawled = await crawlCreatorProfile(args.creatorUrl, campaign.targetNiche);

    // 3. Create Creator Record in Convex
    const creatorId: Id<"creators"> = await ctx.runMutation(api.creators.create, {
      name: crawled.name,
      bioLink: crawled.bioLink,
      contactEmail: crawled.contactEmail,
      audienceNiche: crawled.audienceNiche,
      brandFitScore: crawled.brandFitScore,
      scrapedSummary: crawled.scrapedSummary,
      pastSponsors: crawled.pastSponsors,
    });

    // 4. Initial Pitch Generation
    const pitchSubject = `Partnership Collaboration: ${campaign.title}`;
    const pitchBody = `Hi ${crawled.name},

I came across your work at ${crawled.bioLink} and was really impressed by your content in the ${campaign.targetNiche} space! We loved seeing your previous collaborations with ${crawled.pastSponsors.slice(0, 2).join(" & ")}.

We are currently launching "${campaign.title}" and would love to partner with you on ${campaign.deliverableRequirements}.

Our allocated budget for this deliverable is up to $${campaign.budgetCap.toLocaleString()} USD. Could you let us know your current rates and availability for next month?

Best regards,
CollabAgent Partner Intelligence
collab-agent@agentmail.to`;

    // 5. Dispatch Email via AgentMail
    const mailResult = await sendAgentMail({
      to: crawled.contactEmail,
      subject: pitchSubject,
      body: pitchBody,
    });

    // 6. Create Thread Record
    const threadId: Id<"threads"> = await ctx.runMutation(api.threads.createInitialThread, {
      creatorId,
      campaignId: campaign._id,
      agentMailThreadId: mailResult.threadId,
      proposedFee: Math.round(campaign.budgetCap * 0.8),
      agreedDeliverables: campaign.deliverableRequirements,
    });

    // 7. Log Outbound Message
    await ctx.runMutation(api.messages.addMessage, {
      threadId,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      extractedIntent: "initial_outreach_pitch",
      subject: pitchSubject,
      rawBody: pitchBody,
    });

    return { success: true, creatorId, threadId };
  },
});

export const processInboundReply = action({
  args: {
    threadId: v.id("threads"),
    incomingBody: v.string(),
    senderAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Fetch Thread with Context
    const thread = await ctx.runQuery(api.threads.get, { id: args.threadId });
    if (!thread || !thread.creator || !thread.campaign) {
      throw new Error("Thread, creator, or campaign not found");
    }

    const senderEmail = args.senderAddress || thread.creator.contactEmail;

    // 2. Log Inbound Message
    await ctx.runMutation(api.messages.addMessage, {
      threadId: thread._id,
      sender: "creator",
      senderAddress: senderEmail,
      extractedIntent: "inbound_creator_reply",
      subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
      rawBody: args.incomingBody,
    });

    // 3. OpenAI Negotiation Analysis
    const analysis = await analyzeAndDraftNegotiation({
      campaignTitle: thread.campaign.title,
      budgetCap: thread.campaign.budgetCap,
      deliverableRequirements: thread.campaign.deliverableRequirements,
      creatorName: thread.creator.name,
      incomingMessage: args.incomingBody,
      previousProposedFee: thread.proposedFee,
    });

    // 4. Autonomous Action or Flag for Approval
    if (analysis.needsApproval) {
      // Flag for Human Approval
      await ctx.runMutation(api.threads.flagForHumanApproval, {
        threadId: thread._id,
        draftCounterOffer: analysis.draftReply,
        proposedFee: analysis.proposedFee,
      });
      return { status: "flagged_for_approval", analysis };
    } else {
      // Auto-send approved/counter email via AgentMail
      await sendAgentMail({
        to: thread.creator.contactEmail,
        subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
        body: analysis.draftReply,
        threadId: thread.agentMailThreadId,
      });

      // Log Outbound Agent Message
      await ctx.runMutation(api.messages.addMessage, {
        threadId: thread._id,
        sender: "agent",
        senderAddress: "collab-agent@agentmail.to",
        extractedIntent: analysis.extractedIntent,
        subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
        rawBody: analysis.draftReply,
      });

      // Update Thread Stage
      await ctx.runMutation(api.threads.updateStage, {
        id: thread._id,
        stage: analysis.recommendedStage,
        proposedFee: analysis.proposedFee,
      });

      return { status: "autonomous_reply_sent", analysis };
    }
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if campaign already exists
    const existing = await ctx.db.query("campaigns").first();
    if (existing) {
      return { message: "Campaign already initialized", campaignId: existing._id };
    }

    const now = Date.now();

    // 1. Create Showcase Campaign
    const campaignId = await ctx.db.insert("campaigns", {
      title: "Q4 AI Productivity Suite Launch",
      budgetCap: 2000,
      targetNiche: "Developer Tools & AI Workflows",
      deliverableRequirements: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      status: "active",
      createdAt: now - 86400000 * 3,
    });

    // 2. Seed Creators
    const sarahId = await ctx.db.insert("creators", {
      name: "Sarah Chen",
      bioLink: "https://sarahchen.dev/media-kit",
      contactEmail: "sarah@sarahchen.dev",
      audienceNiche: "AI Engineering & Full-stack",
      brandFitScore: 96,
      scrapedSummary: "Firecrawl extracted: 140k YouTube subscribers, 82k newsletter readers. Consistent coverage of LLM tools, agent architectures, and developer productivity.",
      pastSponsors: ["Cursor", "Convex", "Anthropic"],
      createdAt: now - 86400000 * 2,
    });

    const marcusId = await ctx.db.insert("creators", {
      name: "Marcus Vance",
      bioLink: "https://marcusvance.design",
      contactEmail: "collab@marcusvance.design",
      audienceNiche: "Frontend & Design Systems",
      brandFitScore: 84,
      scrapedSummary: "Firecrawl extracted: 65k followers on X, runs weekly UI teardown newsletter with 22k designers. High engagement on modern dev tools.",
      pastSponsors: ["Linear", "Figma", "Raycast"],
      createdAt: now - 86400000 * 2,
    });

    const alexId = await ctx.db.insert("creators", {
      name: "Alex Rivera",
      bioLink: "https://alexrivera.tech/links",
      contactEmail: "alex@riveratech.io",
      audienceNiche: "Cloud & Backend Architecture",
      brandFitScore: 91,
      scrapedSummary: "Firecrawl extracted: Host of The Modern Backend Podcast (45k listeners/ep). Active open source contributor and tech conference speaker.",
      pastSponsors: ["AWS", "Supabase", "Cloudflare"],
      createdAt: now - 86400000 * 2,
    });

    const elenaId = await ctx.db.insert("creators", {
      name: "Elena Rostova",
      bioLink: "https://elena-ai.substack.com",
      contactEmail: "partnerships@elena-ai.io",
      audienceNiche: "Applied AI & Automation",
      brandFitScore: 94,
      scrapedSummary: "Firecrawl extracted: Top 10 Substack in Tech, 92k subscribers, 46% open rate. Specializes in workflow automation and autonomous agents.",
      pastSponsors: ["Make", "Zapier", "Notion AI"],
      createdAt: now - 86400000 * 3,
    });

    const devBroId = await ctx.db.insert("creators", {
      name: "DevBro Stream",
      bioLink: "https://twitch.tv/devbro",
      contactEmail: "contact@devbrostream.tv",
      audienceNiche: "Live Coding & Gaming",
      brandFitScore: 52,
      scrapedSummary: "Firecrawl extracted: 30k Twitch followers. Primarily casual gaming and live hackathons with sporadic developer audience match.",
      pastSponsors: ["Razer", "NordVPN"],
      createdAt: now - 86400000 * 3,
    });

    // 3. Seed Threads Across Stages
    // Discovered
    await ctx.db.insert("threads", {
      creatorId: sarahId,
      campaignId,
      agentMailThreadId: "am_th_sarah_01",
      stage: "discovered",
      proposedFee: 1800,
      agreedDeliverables: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 4,
    });

    // Pitched
    const marcusThreadId = await ctx.db.insert("threads", {
      creatorId: marcusId,
      campaignId,
      agentMailThreadId: "am_th_marcus_02",
      stage: "pitched",
      proposedFee: 1600,
      agreedDeliverables: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 8,
    });
    await ctx.db.insert("messages", {
      threadId: marcusThreadId,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: now - 3600000 * 8,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Marcus, loved your recent design system breakdowns! We'd love to sponsor your next newsletter with a $1,600 budget allocation. Let us know if you're open to partnering.",
    });

    // Negotiating (Flagged for Human Approval)
    const alexThreadId = await ctx.db.insert("threads", {
      creatorId: alexId,
      campaignId,
      agentMailThreadId: "am_th_alex_03",
      stage: "negotiating",
      proposedFee: 2500,
      agreedDeliverables: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      humanOverride: false,
      pendingApproval: true,
      draftCounterOffer: "Hi Alex, thanks for getting back to us! While $2,500 is above our $2,000 cap for this tier, we'd love to make this work. Would you consider $2,000 flat, or alternatively 1 podcast mid-roll + 1 newsletter feature? Let us know!",
      lastActivityAt: now - 3600000 * 2,
    });
    await ctx.db.insert("messages", {
      threadId: alexThreadId,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: now - 86400000,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Alex, we'd love to partner on an episode sponsorship for the Modern Backend Podcast.",
    });
    await ctx.db.insert("messages", {
      threadId: alexThreadId,
      sender: "creator",
      senderAddress: "alex@riveratech.io",
      timestamp: now - 3600000 * 2,
      extractedIntent: "rate_counter_exceeds_budget",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hey CollabAgent team! Our standard rate for a dedicated deep dive episode plus social distribution is $2,500. Let me know if that works within your Q4 budget.",
    });

    // Accepted
    const elenaThreadId = await ctx.db.insert("threads", {
      creatorId: elenaId,
      campaignId,
      agentMailThreadId: "am_th_elena_04",
      stage: "accepted",
      proposedFee: 1750,
      agreedDeliverables: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 12,
    });
    await ctx.db.insert("messages", {
      threadId: elenaThreadId,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: now - 86400000 * 2,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Elena, we'd love to sponsor your Substack feature for our upcoming AI launch.",
    });
    await ctx.db.insert("messages", {
      threadId: elenaThreadId,
      sender: "creator",
      senderAddress: "partnerships@elena-ai.io",
      timestamp: now - 86400000,
      extractedIntent: "rate_proposal_within_budget",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi team, happy to do a featured section for $1,750 on October 14th edition.",
    });
    await ctx.db.insert("messages", {
      threadId: elenaThreadId,
      sender: "agent",
      senderAddress: "collab-agent@agentmail.to",
      timestamp: now - 3600000 * 12,
      extractedIntent: "agreement_confirmed",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Confirmed! $1,750 is locked in. We will dispatch the creative assets and tracking links by Friday.",
    });

    // Declined
    const devBroThreadId = await ctx.db.insert("threads", {
      creatorId: devBroId,
      campaignId,
      agentMailThreadId: "am_th_devbro_05",
      stage: "declined",
      proposedFee: 0,
      agreedDeliverables: "None",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 86400000,
    });
    await ctx.db.insert("messages", {
      threadId: devBroThreadId,
      sender: "creator",
      senderAddress: "contact@devbrostream.tv",
      timestamp: now - 86400000,
      extractedIntent: "decline",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Thanks for reaching out, but our schedule is currently booked solid for Q4. Best of luck with the launch!",
    });

    return { success: true, campaignId };
  },
});
