import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { agentmail } from "./email";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// Mount Better Auth HTTP endpoints with CORS support
authComponent.registerRoutes(http, createAuth, { cors: true });


http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await agentmail.handleWebhook(
      ctx as unknown as Parameters<typeof agentmail.handleWebhook>[0],
      req
    );
  }),
});

http.route({
  path: "/agentmail-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const raw = (await request.json()) as unknown;
      if (!raw || typeof raw !== "object") {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const bodyObj = raw as Record<string, unknown>;
      const threadIdStr = typeof bodyObj.threadId === "string" ? bodyObj.threadId : undefined;
      const fromStr = typeof bodyObj.from === "string" ? bodyObj.from : undefined;
      const textStr = typeof bodyObj.text === "string" ? bodyObj.text : "";
      const bodyStr = typeof bodyObj.body === "string" ? bodyObj.body : "";
      const incomingBody = textStr || bodyStr;

      if (!threadIdStr && !incomingBody) {
        return new Response(
          JSON.stringify({ error: "Missing threadId or message body in webhook payload" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

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

      if (!targetThreadId) {
        return new Response(
          JSON.stringify({
            received: true,
            processed: false,
            reason: "No matching campaign thread found for this incoming email",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // 3. Trigger Convex deterministic state machine action (processInboundReply)
      const pipelineResult = await ctx.runAction(api.pipeline.processInboundReply, {
        threadId: targetThreadId,
        incomingBody: incomingBody || "Incoming message received via AgentMail.",
        senderAddress: fromStr,
      });

      return new Response(
        JSON.stringify({
          success: true,
          processed: true,
          threadId: targetThreadId,
          rule: pipelineResult.rule,
          status: pipelineResult.status,
          analysis: pipelineResult.analysis,
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      console.error("AgentMail webhook processing error:", err);
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }),
});

export default http;
