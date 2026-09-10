import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import type { CrawledCreatorProfile } from "./integrations/firecrawl";
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
    const crawled: CrawledCreatorProfile = await ctx.runAction(api.firecrawl.scrapeCreator, {
      url: args.creatorUrl,
      targetNiche: campaign.targetNiche,
    });

    // 3. Create Creator Record in Convex
    const creatorId: Id<"creators"> = await ctx.runMutation(api.creators.create, {
      name: crawled.name,
      bioLink: crawled.bioLink,
      email: crawled.contactEmail,
      platform: "youtube",
      status: "in_outreach",
      estCost: crawled.baseRate ?? 1800,
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

Our allocated budget for this deliverable is up to $${campaign.budget.toLocaleString()} ${campaign.currency}. Could you let us know your current rates and availability for next month?

Best regards,
Parley Partner Intelligence
parley@agentmail.to`;

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
      proposedFee: Math.round(campaign.budget * 0.8),
      agreedDeliverables: campaign.deliverableRequirements,
    });

    // 7. Log Outbound Message
    await ctx.runMutation(api.messages.addMessage, {
      threadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
      extractedIntent: "initial_outreach_pitch",
      subject: pitchSubject,
      rawBody: pitchBody,
    });

    return { success: true, creatorId, threadId };
  },
});


/**
 * Phase 1 — Lead Scraping: Discover creators from the web based on the campaign's
 * target niche and save them as collected leads. No outreach is sent.
 */
export const scrapeLeadsForCampaign = action({
  args: {
    campaignId: v.id("campaigns"),
    maxLeads: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ found: number; skipped: number; leads: Array<{ name: string; url: string; niche: string; fitScore: number }> }> => {
    const limit = args.maxLeads ?? 5;

    // 1. Read campaign to get the target niche
    const campaign: Doc<"campaigns"> | null = await ctx.runQuery(api.campaigns.get, {
      id: args.campaignId,
    });
    if (!campaign) throw new Error("Campaign not found");

    const niche = campaign.targetNiche;

    // 2. Search the web for creator profiles in this niche
    const searchQuery = `${niche} content creator influencer media kit sponsorship rates`;
    const searchResults = await ctx.runAction(api.firecrawl.searchWeb, {
      query: searchQuery,
      limit: limit + 3, // fetch extras to cover scrape failures
    });

    const resultsList = searchResults?.web ?? [];
    if (resultsList.length === 0) {
      return { found: 0, skipped: 0, leads: [] };
    }

    let found = 0;
    let skipped = 0;
    const leads: Array<{ name: string; url: string; niche: string; fitScore: number }> = [];

    for (const result of resultsList) {
      if (found >= limit) break;

      const url: string | undefined =
        typeof result === "object" && result !== null && "url" in result
          ? (result as { url: string }).url
          : undefined;
      if (!url) { skipped++; continue; }

      try {
        // 3. Scrape each discovered URL for creator profile data
        const crawled = await ctx.runAction(api.firecrawl.scrapeCreator, {
          url,
          targetNiche: niche,
        });

        // 4. Save as a collected lead — status "collected", no thread or email
        await ctx.runMutation(api.creators.create, {
          name: crawled.name,
          bioLink: crawled.bioLink,
          email: crawled.contactEmail,
          platform: "youtube",
          status: "collected",
          estCost: crawled.baseRate ?? undefined,
          audienceNiche: crawled.audienceNiche,
          brandFitScore: crawled.brandFitScore,
          scrapedSummary: crawled.scrapedSummary,
          pastSponsors: crawled.pastSponsors,
        });

        leads.push({ name: crawled.name, url, niche: crawled.audienceNiche, fitScore: crawled.brandFitScore });
        found++;
      } catch {
        skipped++;
      }
    }

    return { found, skipped, leads };
  },
});

/**
 * Phase 1 — Lead Scraping (manual): Scrape a single creator URL and save as a
 * collected lead. No outreach is sent.
 */
export const scrapeLeadFromUrl = action({
  args: {
    campaignId: v.id("campaigns"),
    creatorUrl: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ name: string; url: string; fitScore: number }> => {
    const campaign: Doc<"campaigns"> | null = await ctx.runQuery(api.campaigns.get, {
      id: args.campaignId,
    });
    if (!campaign) throw new Error("Campaign not found");

    const crawled = await ctx.runAction(api.firecrawl.scrapeCreator, {
      url: args.creatorUrl,
      targetNiche: campaign.targetNiche,
    });

    await ctx.runMutation(api.creators.create, {
      name: crawled.name,
      bioLink: crawled.bioLink,
      email: crawled.contactEmail,
      platform: "youtube",
      status: "collected",
      estCost: crawled.baseRate ?? undefined,
      audienceNiche: crawled.audienceNiche,
      brandFitScore: crawled.brandFitScore,
      scrapedSummary: crawled.scrapedSummary,
      pastSponsors: crawled.pastSponsors,
    });

    return { name: crawled.name, url: args.creatorUrl, fitScore: crawled.brandFitScore };
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

    const senderEmail = args.senderAddress || thread.creator.email;
    const maxBudget = thread.campaign.budget;

    // 2. Log Inbound Message to messages table
    await ctx.runMutation(api.messages.addMessage, {
      threadId: thread._id,
      sender: "creator",
      senderAddress: senderEmail,
      extractedIntent: "inbound_creator_reply",
      subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
      rawBody: args.incomingBody,
    });

    // 3. Structured Parsing with OpenAI
    const analysis = await analyzeAndDraftNegotiation({
      campaignTitle: thread.campaign.title,
      budget: maxBudget,
      deliverableRequirements: thread.campaign.deliverableRequirements,
      creatorName: thread.creator.name,
      incomingMessage: args.incomingBody,
      previousProposedFee: thread.proposedFee,
    });

    const requestedRate = analysis.requestedRate ?? analysis.proposedFee;

    // 4. Constraint Evaluation (Convex Rules Engine - Always Human-in-the-Loop)
    // Once an email is replied, it requires human intervention before any outbound response is dispatched.

    // Rule D: Creator strictly declined
    if (analysis.intent === "decline") {
      await ctx.runMutation(api.threads.flagForHumanApproval, {
        threadId: thread._id,
        draftCounterOffer: analysis.draftReply,
        proposedFee: 0,
        requestedRate,
        stage: "review_required",
        ruleTriggered: "rule_d",
        sentimentScore: analysis.sentimentScore,
        reasoning: "Creator indicated decline or unwillingness to collaborate. Draft acknowledgment awaiting human review.",
      });

      return {
        rule: "rule_d",
        status: "declined_pending_review",
        analysis,
      };
    }

    // Rule A (Green Light): requestedRate <= maxBudget OR intent is accept
    if (analysis.intent === "accept" || requestedRate <= maxBudget) {
      const agreedFee = Math.min(requestedRate, maxBudget);

      await ctx.runMutation(api.threads.flagForHumanApproval, {
        threadId: thread._id,
        draftCounterOffer: analysis.draftReply,
        proposedFee: agreedFee,
        requestedRate,
        stage: "review_required",
        ruleTriggered: "rule_a",
        sentimentScore: analysis.sentimentScore,
        reasoning: "Rule A Green Light: Rate within budget cap. Draft confirmation prepared with contract link awaiting human approval.",
      });

      return {
        rule: "rule_a",
        status: "accepted_pending_draft",
        analysis,
      };
    }

    // Rule C (Hard Block): requestedRate > 125% of budget OR hostile sentiment
    const isHardBlock = requestedRate > maxBudget * 1.25 || analysis.sentimentScore <= 4;
    if (isHardBlock) {
      await ctx.runMutation(api.threads.flagForHumanApproval, {
        threadId: thread._id,
        draftCounterOffer: analysis.draftReply,
        proposedFee: requestedRate,
        requestedRate,
        stage: "review_required",
        ruleTriggered: "rule_c",
        sentimentScore: analysis.sentimentScore,
        reasoning: `Rule C Hard Block: Requested fee ($${requestedRate.toLocaleString()}) exceeds 125% of budget ($${maxBudget.toLocaleString()}) or flagged sentiment risk (${analysis.sentimentScore}/10).`,
      });

      return {
        rule: "rule_c",
        status: "review_required",
        analysis,
      };
    }

    // Rule B (Counter-Offer): requestedRate > maxBudget but <= 125% of budget
    // Counter-offer anchored to maxBudget
    const counterFee = maxBudget;

    await ctx.runMutation(api.threads.flagForHumanApproval, {
      threadId: thread._id,
      draftCounterOffer: analysis.draftReply,
      proposedFee: counterFee,
      requestedRate,
      stage: "review_required",
      ruleTriggered: "rule_b",
      sentimentScore: analysis.sentimentScore,
      reasoning: `Rule B Counter-Offer: Rate ($${requestedRate.toLocaleString()}) is within 125% of cap. Counter-offer drafted anchored to $${counterFee.toLocaleString()} awaiting human approval.`,
    });

    return {
      rule: "rule_b",
      status: "counter_draft_pending_approval",
      analysis,
    };
  },
});

export const seedDemoData = mutation({
  args: {
    resetAllData: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.resetAllData) {
      const messages = await ctx.db.query("messages").collect();
      for (const m of messages) await ctx.db.delete(m._id);

      const threads = await ctx.db.query("threads").collect();
      for (const t of threads) await ctx.db.delete(t._id);

      const creators = await ctx.db.query("creators").collect();
      for (const c of creators) await ctx.db.delete(c._id);

      const campaigns = await ctx.db.query("campaigns").collect();
      for (const camp of campaigns) await ctx.db.delete(camp._id);
    } else {
      const existing = await ctx.db.query("campaigns").first();
      if (existing) {
        return { message: "CRM already initialized", campaignId: existing._id };
      }
    }

    const now = Date.now();

    // 1. Create Showcase Campaigns
    const campaignId = await ctx.db.insert("campaigns", {
      title: "Q4 AI Productivity Suite Launch",
      status: "active",
      budget: 15000,
      currency: "USD",
      startDate: "2026-10-01",
      endDate: "2026-12-15",
      brief: "Targeting technical founders and senior full-stack developers for our autonomous AI tool suite. Deliverables: 1 dedicated segment + social amplification.",
      targetNiche: "Developer Tools & AI Workflows",
      deliverableRequirements: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      createdAt: now - 86400000 * 3,
    });

    const campaign2Id = await ctx.db.insert("campaigns", {
      title: "Developer Community Outreach EU",
      status: "planning",
      budget: 8500,
      currency: "EUR",
      startDate: "2026-11-01",
      endDate: "2026-12-31",
      brief: "Sponsorship of European software engineering newsletters, podcast mid-rolls, and conference video recaps.",
      targetNiche: "Software Engineering & Cloud Architecture",
      deliverableRequirements: "1 Newsletter Feature + 1 Mid-roll mention",
      createdAt: now - 86400000 * 1,
    });

    // 2. Seed Rich Creators Matching Screenshots
    const creatorSeeds: Array<{
      name: string;
      status: "collected" | "in_outreach" | "negotiating" | "contracted" | "declined";
      platform: "youtube" | "twitter" | "instagram" | "tiktok" | "substack" | "linkedin" | "twitch";
      email: string;
      country: string;
      followers: number;
      views: number;
      engagementRate: number;
      estCost: number;
      bioLink: string;
      audienceNiche: string;
      brandFitScore: number;
      scrapedSummary: string;
      pastSponsors: string[];
    }> = [
      {
        name: "Software Dev",
        status: "collected",
        platform: "youtube",
        email: "contact@softwaredev.io",
        country: "US",
        followers: 12000,
        views: 4000,
        engagementRate: 4.8,
        estCost: 450,
        bioLink: "https://youtube.com/@softwaredev",
        audienceNiche: "Full-stack Engineering",
        brandFitScore: 89,
        scrapedSummary: "Focuses on hands-on software development tutorials and modern web toolchains.",
        pastSponsors: ["Cursor", "Supabase", "Convex"],
      },
      {
        name: "Tech With Tim",
        status: "collected",
        platform: "youtube",
        email: "partnerships@techwithtim.net",
        country: "CA",
        followers: 1200000,
        views: 180000,
        engagementRate: 5.4,
        estCost: 4500,
        bioLink: "https://youtube.com/@techwithtim",
        audienceNiche: "Python & Machine Learning",
        brandFitScore: 92,
        scrapedSummary: "Top developer education channel covering Python, AI/ML, and software architectures.",
        pastSponsors: ["Linear", "Datadog", "JetBrains"],
      },
      {
        name: "James Q Quick",
        status: "collected",
        platform: "youtube",
        email: "james@jamesqquick.com",
        country: "US",
        followers: 195000,
        views: 35000,
        engagementRate: 6.1,
        estCost: 1600,
        bioLink: "https://jamesqquick.com",
        audienceNiche: "Web Development & Cloud",
        brandFitScore: 95,
        scrapedSummary: "Host of Compressed.fm podcast and popular tech educator focusing on developer experience.",
        pastSponsors: ["Convex", "Clerk", "Netlify"],
      },
      {
        name: "Web Dev Simplified",
        status: "collected",
        platform: "youtube",
        email: "kyle@webdevsimplified.com",
        country: "US",
        followers: 1500000,
        views: 220000,
        engagementRate: 4.9,
        estCost: 5500,
        bioLink: "https://webdevsimplified.com",
        audienceNiche: "Frontend & Full-stack",
        brandFitScore: 94,
        scrapedSummary: "Clear, concise tutorials teaching modern frontend and backend development to over 1.5M devs.",
        pastSponsors: ["Vercel", "Convex", "Webflow"],
      },
      {
        name: "Mikey Vibes",
        status: "collected",
        platform: "youtube",
        email: "mikey@vibesmedia.io",
        country: "US",
        followers: 12000,
        views: 4000,
        engagementRate: 4.2,
        estCost: 500,
        bioLink: "https://youtube.com/@mikeyvibes",
        audienceNiche: "Developer Workspaces & Tech Setups",
        brandFitScore: 80,
        scrapedSummary: "Covers productivity gear, developer workspace setups, and software workflows.",
        pastSponsors: ["Keychron", "Autonomous", "Raycast"],
      },
      {
        name: "Matt Penny",
        status: "collected",
        platform: "youtube",
        email: "matt@pennymedia.com",
        country: "UK",
        followers: 15000,
        views: 6000,
        engagementRate: 4.5,
        estCost: 650,
        bioLink: "https://youtube.com/@mattpenny",
        audienceNiche: "UI/UX & SaaS Building",
        brandFitScore: 86,
        scrapedSummary: "Indie hacker building SaaS products in public and sharing design system architecture.",
        pastSponsors: ["Figma", "Tailwind", "LemonSqueezy"],
      },
      {
        name: "Skill Leap AI",
        status: "collected",
        platform: "youtube",
        email: "contact@skillleap.ai",
        country: "US",
        followers: 10000,
        views: 5000,
        engagementRate: 5.0,
        estCost: 550,
        bioLink: "https://skillleap.ai",
        audienceNiche: "AI Tools & Automation",
        brandFitScore: 91,
        scrapedSummary: "Workflow automation channel covering LLMs, Make.com, and autonomous agents.",
        pastSponsors: ["Notion AI", "OpenAI", "Zapier"],
      },
      {
        name: "Jack Roberts",
        status: "collected",
        platform: "youtube",
        email: "jack@robertsmedia.co",
        country: "UK",
        followers: 20000,
        views: 8000,
        engagementRate: 4.6,
        estCost: 750,
        bioLink: "https://jackroberts.dev",
        audienceNiche: "Next.js & React Ecosystem",
        brandFitScore: 88,
        scrapedSummary: "Modern web architecture deep dives and production deployment tutorials.",
        pastSponsors: ["Vercel", "Prisma", "Resend"],
      },
      {
        name: "Mikey West",
        status: "collected",
        platform: "youtube",
        email: "mikey@devtalks.tv",
        country: "US",
        followers: 15000,
        views: 5000,
        engagementRate: 4.1,
        estCost: 600,
        bioLink: "https://devtalks.tv",
        audienceNiche: "Full-stack Engineering",
        brandFitScore: 82,
        scrapedSummary: "Weekly coding livestreams and full-stack walkthroughs.",
        pastSponsors: ["Linode", "DigitalOcean"],
      },
      {
        name: "Kevin Stratvert",
        status: "collected",
        platform: "youtube",
        email: "kevin@kevinstratvert.com",
        country: "US",
        followers: 1500000,
        views: 100000,
        engagementRate: 3.5,
        estCost: 4000,
        bioLink: "https://kevinstratvert.com",
        audienceNiche: "Productivity Software & Microsoft Tech",
        brandFitScore: 75,
        scrapedSummary: "Mass-audience tech tutorials explaining modern software to millions of professionals.",
        pastSponsors: ["Microsoft", "Loom", "Notion"],
      },
      {
        name: "Dan Martell",
        status: "collected",
        platform: "youtube",
        email: "dan@martellmedia.com",
        country: "CA",
        followers: 500000,
        views: 150000,
        engagementRate: 5.8,
        estCost: 6000,
        bioLink: "https://danmartell.com",
        audienceNiche: "SaaS Scaling & Entrepreneurship",
        brandFitScore: 85,
        scrapedSummary: "Serial SaaS founder and author teaching tech founders how to scale enterprise software.",
        pastSponsors: ["HubSpot", "Mercury", "Carta"],
      },
      {
        name: "ThePrimeagen",
        status: "collected",
        platform: "youtube",
        email: "theprime@theprimeagen.tv",
        country: "US",
        followers: 800000,
        views: 200000,
        engagementRate: 7.2,
        estCost: 5000,
        bioLink: "https://youtube.com/@ThePrimeagen",
        audienceNiche: "Systems Programming & Dev Opinions",
        brandFitScore: 96,
        scrapedSummary: "High-energy engineering commentary, Vim workflows, Rust, and infrastructure critiques.",
        pastSponsors: ["Cursor", "Convex", "GitKraken", "Datadog"],
      },
      {
        name: "Alex Finn",
        status: "collected",
        platform: "youtube",
        email: "alex@alexfinn.ai",
        country: "US",
        followers: 35000,
        views: 12000,
        engagementRate: 5.1,
        estCost: 1100,
        bioLink: "https://alexfinn.ai",
        audienceNiche: "AI Agents & Autonomous Systems",
        brandFitScore: 93,
        scrapedSummary: "Deep dives into building and deploying autonomous agents with real codebases.",
        pastSponsors: ["Anthropic", "LangChain", "Convex"],
      },
      {
        name: "Matt Wolfe",
        status: "collected",
        platform: "youtube",
        email: "matt@futuretools.io",
        country: "US",
        followers: 500000,
        views: 100000,
        engagementRate: 4.8,
        estCost: 3800,
        bioLink: "https://futuretools.io",
        audienceNiche: "Emerging AI Tools & Platforms",
        brandFitScore: 90,
        scrapedSummary: "Founder of FutureTools.io reviewing the newest generative AI breakthroughs.",
        pastSponsors: ["Midjourney", "Descript", "ElevenLabs"],
      },
      // Active Pipeline Creators
      {
        name: "Sarah Chen",
        status: "in_outreach",
        platform: "youtube",
        email: "sarah@sarahchen.dev",
        country: "US",
        followers: 140000,
        views: 82000,
        engagementRate: 6.5,
        estCost: 1800,
        bioLink: "https://sarahchen.dev/media-kit",
        audienceNiche: "AI Engineering & Full-stack",
        brandFitScore: 96,
        scrapedSummary: "140k YouTube subscribers, 82k newsletter readers. Consistent coverage of LLM tools, agent architectures, and developer productivity.",
        pastSponsors: ["Cursor", "Convex", "Anthropic"],
      },
      {
        name: "Marcus Vance",
        status: "in_outreach",
        platform: "twitter",
        email: "collab@marcusvance.design",
        country: "US",
        followers: 65000,
        views: 22000,
        engagementRate: 4.8,
        estCost: 1600,
        bioLink: "https://marcusvance.design",
        audienceNiche: "Frontend & Design Systems",
        brandFitScore: 84,
        scrapedSummary: "65k followers on X, runs weekly UI teardown newsletter with 22k designers. High engagement on modern dev tools.",
        pastSponsors: ["Linear", "Figma", "Raycast"],
      },
      {
        name: "Alex Rivera",
        status: "negotiating",
        platform: "youtube",
        email: "alex@riveratech.io",
        country: "US",
        followers: 45000,
        views: 18000,
        engagementRate: 5.2,
        estCost: 2000,
        bioLink: "https://alexrivera.tech/links",
        audienceNiche: "Cloud & Backend Architecture",
        brandFitScore: 91,
        scrapedSummary: "Host of The Modern Backend Podcast (45k listeners/ep). Active open source contributor and tech conference speaker.",
        pastSponsors: ["AWS", "Supabase", "Cloudflare"],
      },
      {
        name: "Elena Rostova",
        status: "contracted",
        platform: "substack",
        email: "partnerships@elena-ai.io",
        country: "DE",
        followers: 92000,
        views: 45000,
        engagementRate: 7.1,
        estCost: 1750,
        bioLink: "https://elena-ai.substack.com",
        audienceNiche: "Applied AI & Automation",
        brandFitScore: 94,
        scrapedSummary: "Top 10 Substack in Tech, 92k subscribers, 46% open rate. Specializes in workflow automation and autonomous agents.",
        pastSponsors: ["Make", "Zapier", "Notion AI"],
      },
      {
        name: "DevBro Stream",
        status: "declined",
        platform: "twitch",
        email: "contact@devbrostream.tv",
        country: "US",
        followers: 30000,
        views: 12000,
        engagementRate: 3.2,
        estCost: 800,
        bioLink: "https://twitch.tv/devbro",
        audienceNiche: "Live Coding & Gaming",
        brandFitScore: 52,
        scrapedSummary: "30k Twitch followers. Primarily casual gaming and live hackathons with sporadic developer audience match.",
        pastSponsors: ["Razer", "NordVPN"],
      },
    ];

    const insertedCreators: Record<string, Id<"creators">> = {};

    for (let i = 0; i < creatorSeeds.length; i++) {
      const seed = creatorSeeds[i];
      const id = await ctx.db.insert("creators", {
        ...seed,
        createdAt: now - 86400000 * (creatorSeeds.length - i),
      });
      insertedCreators[seed.name] = id;
    }

    // 3. Seed Pipeline Threads
    // Discovered
    await ctx.db.insert("threads", {
      creatorId: insertedCreators["Sarah Chen"],
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
      creatorId: insertedCreators["Marcus Vance"],
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
      senderAddress: "parley@agentmail.to",
      timestamp: now - 3600000 * 8,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Marcus, loved your recent design system breakdowns! We'd love to sponsor your next newsletter with a $1,600 budget allocation. Let us know if you're open to partnering.",
    });

    // Review Required (Rule C Hard Block: $2,500 > 125% of $2,000 cap)
    const alexThreadId = await ctx.db.insert("threads", {
      creatorId: insertedCreators["Alex Rivera"],
      campaignId,
      agentMailThreadId: "am_th_alex_03",
      stage: "review_required",
      proposedFee: 2500,
      requestedRate: 2500,
      ruleTriggered: "rule_c",
      sentimentScore: 6,
      reasoning: "Rule C Hard Block: Rate requested ($2,500) exceeds 125% of allocated cap ($2,000). Awaiting marketing director review.",
      agreedDeliverables: "1 Dedicated YouTube Video + 1 X/Twitter Thread",
      humanOverride: false,
      pendingApproval: true,
      draftCounterOffer: "Hi Alex, thanks for getting back to us! While $2,500 is above our $2,000 cap for this tier, we'd love to make this work. Would you consider $2,000 flat, or alternatively 1 podcast mid-roll + 1 newsletter feature? Let us know!",
      lastActivityAt: now - 3600000 * 2,
    });
    await ctx.db.insert("messages", {
      threadId: alexThreadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
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
      rawBody: "Hey Parley team! Our standard rate for a dedicated deep dive episode plus social distribution is $2,500. Let me know if that works within your Q4 budget.",
    });

    // Negotiating (Rule B Counter-Offer Drafted within 125% cap)
    const jackThreadId = await ctx.db.insert("threads", {
      creatorId: insertedCreators["Jack Roberts"],
      campaignId,
      agentMailThreadId: "am_th_jack_06",
      stage: "negotiating",
      proposedFee: 2000,
      requestedRate: 2200,
      ruleTriggered: "rule_b",
      sentimentScore: 8,
      reasoning: "Rule B Counter: Creator asked $2,200 (within 125% of $2,000). Autonomous counter anchored to $2,000 dispatched.",
      agreedDeliverables: "1 Dedicated YouTube Video",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 3,
    });
    await ctx.db.insert("messages", {
      threadId: jackThreadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
      timestamp: now - 86400000 * 1.5,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Jack, loved your Next.js deep dive! We'd love to partner for an upcoming feature.",
    });
    await ctx.db.insert("messages", {
      threadId: jackThreadId,
      sender: "creator",
      senderAddress: "jack@robertsmedia.co",
      timestamp: now - 3600000 * 5,
      extractedIntent: "counter_offer",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hey team! Can we do $2,200 for the dedicated tutorial video? Let me know.",
    });
    await ctx.db.insert("messages", {
      threadId: jackThreadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
      timestamp: now - 3600000 * 3,
      extractedIntent: "counter_offer_rule_b",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Jack, thanks for following up! While $2,200 is slightly above our cap, we can do $2,000 flat if that works for you. Let us know!",
    });

    // Accepted (Rule A Green Light: <= budget)
    const elenaThreadId = await ctx.db.insert("threads", {
      creatorId: insertedCreators["Elena Rostova"],
      campaignId,
      agentMailThreadId: "am_th_elena_04",
      stage: "accepted",
      proposedFee: 1750,
      requestedRate: 1750,
      ruleTriggered: "rule_a",
      sentimentScore: 9,
      contractLink: `https://parley.app/onboard/${campaignId}?creator=${insertedCreators["Elena Rostova"]}`,
      agreedDeliverables: "1 Newsletter Feature + Social Amplification",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 12,
    });
    await ctx.db.insert("messages", {
      threadId: elenaThreadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
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
      senderAddress: "parley@agentmail.to",
      timestamp: now - 3600000 * 12,
      extractedIntent: "agreement_confirmed",
      subject: "Re: Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Confirmed! $1,750 is locked in. Our contract and onboarding link is active: https://parley.app/onboard/elena",
    });

    // Ghosted (No reply for > 5 days)
    const mikeyThreadId = await ctx.db.insert("threads", {
      creatorId: insertedCreators["Mikey West"],
      campaignId,
      agentMailThreadId: "am_th_mikey_07",
      stage: "ghosted",
      proposedFee: 1500,
      agreedDeliverables: "1 Dedicated Stream Segment",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 86400000 * 6,
    });
    await ctx.db.insert("messages", {
      threadId: mikeyThreadId,
      sender: "agent",
      senderAddress: "parley@agentmail.to",
      timestamp: now - 86400000 * 6,
      extractedIntent: "initial_outreach_pitch",
      subject: "Partnership Collaboration: Q4 AI Productivity Suite Launch",
      rawBody: "Hi Mikey, we would love to sponsor a segment on your upcoming livestream!",
    });

    // Declined
    const devBroThreadId = await ctx.db.insert("threads", {
      creatorId: insertedCreators["DevBro Stream"],
      campaignId,
      agentMailThreadId: "am_th_devbro_05",
      stage: "declined",
      ruleTriggered: "rule_d",
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

    // Seed threads for Campaign 2: Developer Community Outreach EU
    await ctx.db.insert("threads", {
      creatorId: insertedCreators["ThePrimeagen"],
      campaignId: campaign2Id,
      agentMailThreadId: "am_th_prime_eu_01",
      stage: "review_required",
      proposedFee: 750,
      requestedRate: 900,
      ruleTriggered: "rule_c",
      sentimentScore: 7,
      reasoning: "Rule C Hard Block: Rate requested ($900) exceeds EU benchmark cap ($750). Awaiting approval.",
      agreedDeliverables: "1 Newsletter Feature + 1 Mid-roll mention",
      humanOverride: false,
      pendingApproval: true,
      draftCounterOffer: "Hey Prime, thanks for the counter! While $900 is above our $750 cap, would $750 flat work for this segment? Let us know!",
      lastActivityAt: now - 3600000 * 2,
    });

    await ctx.db.insert("threads", {
      creatorId: insertedCreators["Software Dev"],
      campaignId: campaign2Id,
      agentMailThreadId: "am_th_softdev_eu_02",
      stage: "pitched",
      proposedFee: 450,
      agreedDeliverables: "1 Newsletter Feature",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 5,
    });

    await ctx.db.insert("threads", {
      creatorId: insertedCreators["Matt Penny"],
      campaignId: campaign2Id,
      agentMailThreadId: "am_th_matt_eu_03",
      stage: "negotiating",
      proposedFee: 650,
      requestedRate: 700,
      ruleTriggered: "rule_b",
      sentimentScore: 8,
      reasoning: "Rule B Counter: Asked $700, autonomous counter at $650 sent.",
      agreedDeliverables: "1 Newsletter Feature + Social mention",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 1,
    });

    await ctx.db.insert("threads", {
      creatorId: insertedCreators["Skill Leap AI"],
      campaignId: campaign2Id,
      agentMailThreadId: "am_th_skillleap_eu_04",
      stage: "accepted",
      proposedFee: 550,
      requestedRate: 550,
      ruleTriggered: "rule_a",
      sentimentScore: 9,
      contractLink: `https://parley.app/onboard/${campaign2Id}?creator=${insertedCreators["Skill Leap AI"]}`,
      agreedDeliverables: "1 Newsletter Feature + 1 Mid-roll mention",
      humanOverride: false,
      pendingApproval: false,
      lastActivityAt: now - 3600000 * 9,
    });

    return { success: true, campaignId, campaign2Id, creatorsCount: creatorSeeds.length };
  },
});
