import {
  Agent,
  createTool,
  mockModel,
  listMessages,
  getThreadMetadata,
  createThread,
} from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { z } from "zod";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { query, mutation, action } from "./_generated/server";
import { api, components } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import type { CrawledCreatorProfile, FirecrawlMapResult } from "./integrations/firecrawl";
import { sendAgentMail } from "./integrations/agentmail";
import { analyzeAndDraftNegotiation } from "./integrations/openai";

export interface ThreadWithRelations extends Doc<"threads"> {
  creator: Doc<"creators"> | null;
  campaign: Doc<"campaigns"> | null;
}

export function getLanguageModel(
  modelName: string = process.env.OPENAI_MODEL || "gpt-5.6-sol"
): LanguageModelV4 {
  if (process.env.OPENAI_API_KEY) {
    return openai(modelName);
  }
  return mockModel({
    content: [
      {
        type: "text",
        text: "Autonomous negotiation analyzed with gpt-5.6-sol. Response prepared within campaign budget constraints.",
      },
    ],
  });
}

export const scrapeCreatorTool = createTool({
  description:
    "Scrapes creator portfolio, Linktree, media kit, or social page via Firecrawl to extract audience niche, brand fit score, reach, and past sponsors.",
  inputSchema: z.object({
    url: z.string().describe("The URL to research or scrape"),
    targetNiche: z.string().describe("The campaign target niche"),
  }),
  execute: async (ctx, { url, targetNiche }) => {
    const profile: CrawledCreatorProfile = await ctx.runAction(api.firecrawl.scrapeCreator, {
      url,
      targetNiche,
    });
    return profile;
  },
});

export const mapCreatorSubpagesTool = createTool({
  description:
    "Discovers subpages on a creator's website (such as /media-kit, /rates, /sponsor, /press) via Firecrawl mapping to find missing rate cards and press kits.",
  inputSchema: z.object({
    baseUrl: z.string().describe("The root website URL of the creator"),
  }),
  execute: async (ctx, { baseUrl }) => {
    const mapResult: FirecrawlMapResult = await ctx.runAction(api.firecrawl.mapSubpages, {
      baseUrl,
    });
    return mapResult;
  },
});

export const sendNegotiationEmailTool = createTool({
  description:
    "Dispatches an email to the creator via AgentMail with conversation threading.",
  inputSchema: z.object({
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Plain text body of the email"),
    threadId: z.string().optional().describe("AgentMail thread identifier"),
    inReplyTo: z.string().optional().describe("Message ID being replied to"),
  }),
  execute: async (_ctx, { to, subject, body, threadId, inReplyTo }) => {
    const res = await sendAgentMail({ to, subject, body, threadId, inReplyTo });
    return res;
  },
});

export const flagForApprovalTool = createTool({
  description:
    "Flags the negotiation thread for human marketing manager approval when creator rate exceeds the campaign budget cap.",
  inputSchema: z.object({
    threadId: z.string().describe("Convex thread ID"),
    draftCounterOffer: z.string().describe("Drafted counter-offer message for the creator"),
    proposedFee: z.number().describe("Creator's counter rate or proposed fee in USD"),
  }),
  execute: async (ctx, { threadId, draftCounterOffer, proposedFee }) => {
    await ctx.runMutation(api.threads.flagForHumanApproval, {
      threadId: threadId as Id<"threads">,
      draftCounterOffer,
      proposedFee,
    });
    return { flagged: true, threadId, status: "pending_human_approval" };
  },
});

export const updateNegotiationStageTool = createTool({
  description: "Updates the CRM negotiation stage in Convex for the creator thread.",
  inputSchema: z.object({
    threadId: z.string().describe("Convex thread ID"),
    stage: z.enum([
      "discovered",
      "pitched",
      "negotiating",
      "review_required",
      "accepted",
      "declined",
      "ghosted",
    ]),
    proposedFee: z.number().optional().describe("Final or updated fee in USD"),
  }),
  execute: async (ctx, { threadId, stage, proposedFee }) => {
    await ctx.runMutation(api.threads.updateStage, {
      id: threadId as Id<"threads">,
      stage,
      proposedFee,
    });
    return { success: true, threadId, stage, proposedFee };
  },
});

export const parleyNegotiator = new Agent(components.agent, {
  name: "ParleyNegotiator",
  languageModel: getLanguageModel(),
  instructions: `You are Parley, an autonomous creator collaboration and negotiation agent powered by OpenAI (gpt-5.6-sol) representing brand marketing teams.
Your goals:
1. Conduct research on creator media kits, audience metrics, and brand fit using scrapeCreatorTool.
2. If rates or media kits are not visible on the main page, discover dedicated subpages with mapCreatorSubpagesTool.
3. Pitch sponsorship opportunities clearly with campaign deliverable requirements and budget guidelines.
4. Strategically negotiate rates within the strict budget cap.
5. If a creator counter-offers with a rate exceeding the budget cap, ALWAYS use flagForApprovalTool with a polite counter-offer draft and notify human review.
6. If terms are mutually acceptable or accepted within budget, confirm agreement via sendNegotiationEmailTool and set stage to "accepted".
7. If the creator declines, update stage to "declined" and send a polite sign-off.`,
  tools: {
    scrapeCreator: scrapeCreatorTool,
    mapSubpages: mapCreatorSubpagesTool,
    sendEmail: sendNegotiationEmailTool,
    flagForApproval: flagForApprovalTool,
    updateStage: updateNegotiationStageTool,
  },
});

export const getAgentThread = query({
  args: {
    agentThreadId: v.string(),
  },
  handler: async (ctx, args) => {
    return await getThreadMetadata(ctx, components.agent, {
      threadId: args.agentThreadId,
    });
  },
});

export const listAgentMessages = query({
  args: {
    agentThreadId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await listMessages(ctx, components.agent, {
      threadId: args.agentThreadId,
      paginationOpts: args.paginationOpts,
    });
  },
});

export const createAgentThread = mutation({
  args: {
    title: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const threadId = await createThread(ctx, components.agent, {
      title: args.title,
      userId: args.userId,
    });
    return { threadId };
  },
});

export const askAgent = action({
  args: {
    agentThreadId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args): Promise<{ text: string; toolCalls: number }> => {
    const result = await parleyNegotiator.generateText(
      ctx,
      { threadId: args.agentThreadId },
      { prompt: args.prompt }
    );
    return {
      text: result.text,
      toolCalls: result.toolCalls?.length ?? 0,
    };
  },
});

export const processInboundWithAgent = action({
  args: {
    threadId: v.id("threads"),
    incomingBody: v.string(),
    senderAddress: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ agentThreadId: string; text: string; toolCalls: number }> => {
    // 1. Fetch Thread with Context
    const thread: ThreadWithRelations | null = await ctx.runQuery(api.threads.get, {
      id: args.threadId,
    });
    if (!thread || !thread.creator || !thread.campaign) {
      throw new Error("Thread, creator, or campaign not found");
    }

    const senderEmail = args.senderAddress || thread.creator.email;

    // 2. Record Inbound Message
    await ctx.runMutation(api.messages.addMessage, {
      threadId: thread._id,
      sender: "creator",
      senderAddress: senderEmail,
      extractedIntent: "inbound_creator_reply",
      subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
      rawBody: args.incomingBody,
    });

    // 3. Resolve or initialize Agent Component Thread
    let agentThreadId: string = thread.agentComponentThreadId ?? "";
    if (!agentThreadId) {
      const created = await parleyNegotiator.createThread(ctx, {
        title: `Negotiation with ${thread.creator.name} (${thread.campaign.title})`,
      });
      agentThreadId = created.threadId;
      await ctx.runMutation(api.threads.setAgentComponentThreadId, {
        threadId: thread._id,
        agentComponentThreadId: agentThreadId,
      });
    }

    // 4. Run Agent with Full Context
    const prompt = `Creator "${thread.creator.name}" sent the following email reply:
"""
${args.incomingBody}
"""

Context:
- Campaign: "${thread.campaign.title}"
- Budget Cap: $${thread.campaign.budget} ${thread.campaign.currency}
- Deliverable Requirements: "${thread.campaign.deliverableRequirements}"
- Current Thread ID: "${thread._id}"
- Creator Email: "${thread.creator.email}"
- AgentMail Thread ID: "${thread.agentMailThreadId}"
- Previous Proposed Fee: $${thread.proposedFee} USD

Analyze the incoming message.
- If creator demands a fee > $${thread.campaign.budget}, draft a polite counter-offer and call flagForApproval.
- If creator accepts or proposes a rate <= $${thread.campaign.budget}, call sendEmail to confirm and updateStage to "accepted" (or "negotiating" if finalizing details).
- If creator declines, send polite sign-off via sendEmail and updateStage to "declined".`;

    const result = await parleyNegotiator.generateText(
      ctx,
      { threadId: agentThreadId },
      { prompt }
    );

    // 5. If no tools were autonomously executed (e.g. mockModel during offline testing/evaluation), apply deterministic analysis
    if (!result.toolCalls || result.toolCalls.length === 0) {
      const analysis = await analyzeAndDraftNegotiation({
        campaignTitle: thread.campaign.title,
        budget: thread.campaign.budget,
        deliverableRequirements: thread.campaign.deliverableRequirements,
        creatorName: thread.creator.name,
        incomingMessage: args.incomingBody,
        previousProposedFee: thread.proposedFee,
      });

      if (analysis.needsApproval) {
        await ctx.runMutation(api.threads.flagForHumanApproval, {
          threadId: thread._id,
          draftCounterOffer: analysis.draftReply,
          proposedFee: analysis.proposedFee,
        });
      } else {
        await sendAgentMail({
          to: thread.creator.email,
          subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
          body: analysis.draftReply,
          threadId: thread.agentMailThreadId,
        });

        await ctx.runMutation(api.messages.addMessage, {
          threadId: thread._id,
          sender: "agent",
          senderAddress: "parley@agentmail.to",
          extractedIntent: analysis.intent,
          subject: `Re: Partnership Collaboration: ${thread.campaign.title}`,
          rawBody: analysis.draftReply,
        });

        await ctx.runMutation(api.threads.updateStage, {
          id: thread._id,
          stage: analysis.recommendedStage,
          proposedFee: analysis.proposedFee,
        });
      }
    }

    return {
      agentThreadId,
      text: result.text,
      toolCalls: result.toolCalls?.length ?? 0,
    };
  },
});
