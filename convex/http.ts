import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/agentmail-webhook",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    try {
      const payload = (await request.json()) as {
        threadId?: string;
        from?: string;
        subject?: string;
        text?: string;
        body?: string;
      };

      if (!payload.threadId && !payload.text && !payload.body) {
        return new Response(JSON.stringify({ error: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Find matching thread by agentMailThreadId if provided
      // For webhooks, we can query or run pipeline action
      return new Response(
        JSON.stringify({
          received: true,
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
