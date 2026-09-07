import { query, mutation, internalMutation } from "./_generated/server";
import { components, internal, api } from "./_generated/api";
import { AgentMail, vOutboundId } from "@agentmail/convex";
import type { OutboundId, OutboundStatus } from "@agentmail/convex";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.email.onMessageReceived,
});

/**
 * Reactively query all inbound messages for a given thread.
 */
export const listThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    return await ctx.runQuery(components.agentmail.lib.listInboundMessages, { threadId });
  },
});

/**
 * Reactively query all inbound messages for a given inbox.
 */
export const listInbox = query({
  args: { inboxId: v.string() },
  handler: async (ctx, { inboxId }) => {
    return await ctx.runQuery(components.agentmail.lib.listInboundMessages, { inboxId });
  },
});

/**
 * Check outbound message status reactively.
 */
export const getSendStatus = query({
  args: { outboundId: vOutboundId },
  handler: async (ctx, { outboundId }): Promise<{
    status: OutboundStatus;
    agentmailMessageId: string | null;
    threadId: string | null;
    errorMessage: string | null;
  } | null> => {
    return await agentmail.status(ctx, outboundId);
  },
});

/**
 * Send an email durably via the AgentMail component with automatic retries and delivery tracking.
 */
export const sendEmail = mutation({
  args: {
    inboxId: v.string(),
    to: v.union(v.string(), v.array(v.string())),
    subject: v.string(),
    text: v.string(),
    labels: v.optional(v.array(v.string())),
    threadId: v.optional(v.string()),
    inReplyTo: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<OutboundId> => {
    return await agentmail.sendMessage(ctx, args.inboxId, {
      to: args.to,
      subject: args.subject,
      text: args.text,
      labels: args.labels ?? ["parley-agent"],
      headers: args.inReplyTo ? { "In-Reply-To": args.inReplyTo } : undefined,
    });
  },
});

export interface InboundEmailPayload {
  inbox_id?: string;
  thread_id?: string;
  message_id?: string;
  from?: string;
  to?: string | string[];
  subject?: string;
  text?: string;
  extracted_text?: string;
  html?: string;
}

/**
 * Internal mutation triggered by the AgentMail component webhook whenever an email arrives.
 */
export const onMessageReceived = internalMutation({
  args: {
    message: v.any(),
    thread: v.any(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const rawMsg = args.message as InboundEmailPayload;
    const threadIdStr = typeof rawMsg.thread_id === "string" ? rawMsg.thread_id : undefined;
    const fromStr = typeof rawMsg.from === "string" ? rawMsg.from : undefined;
    const textStr = typeof rawMsg.text === "string" ? rawMsg.text : "";
    const extractedTextStr = typeof rawMsg.extracted_text === "string" ? rawMsg.extracted_text : "";
    const incomingBody = textStr || extractedTextStr;

    // 1. Locate matching Convex thread by AgentMail thread identifier
    let targetThreadId: Id<"threads"> | null = null;
    if (threadIdStr) {
      const matched = await ctx.runQuery(api.threads.getByAgentMailThreadId, {
        agentMailThreadId: threadIdStr,
      });
      if (matched) {
        targetThreadId = matched._id;
      }
    }

    // 2. Fallback: match by sender contact email if threadId not matched
    if (!targetThreadId && fromStr) {
      const creator = await ctx.runQuery(api.creators.getByEmail, { email: fromStr });
      if (creator) {
        const matchedByCreator = await ctx.runQuery(api.threads.getByCreatorId, {
          creatorId: creator._id,
        });
        if (matchedByCreator) {
          targetThreadId = matchedByCreator._id;
        }
      }
    }

    if (targetThreadId) {
      // Trigger AI Agent to process the inbound email asynchronously
      await ctx.scheduler.runAfter(0, api.agent.processInboundWithAgent, {
        threadId: targetThreadId,
        incomingBody: incomingBody || "Incoming message received via AgentMail.",
        senderAddress: fromStr,
      });
    }
  },
});
