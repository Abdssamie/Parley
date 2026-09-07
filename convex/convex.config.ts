import { defineApp } from "convex/server";
import { v } from "convex/values";
import staticHosting from "@convex-dev/static-hosting/convex.config";
import agent from "@convex-dev/agent/convex.config";
import agentmail from "@agentmail/convex/convex.config";
import firecrawl from "@firecrawl/firecrawl-convex/convex.config";
import betterAuth from "@convex-dev/better-auth/convex.config";

const app = defineApp({
  env: {
    FIRECRAWL_API_KEY: v.string(),
    FIRECRAWL_WEBHOOK_SECRET: v.optional(v.string()),
    FIRECRAWL_API_URL: v.optional(v.string()),
  },
});

app.use(staticHosting);
app.use(agent);
app.use(agentmail);
app.use(firecrawl, {
  httpPrefix: "/firecrawl/",
  env: {
    FIRECRAWL_API_KEY: app.env.FIRECRAWL_API_KEY,
    FIRECRAWL_WEBHOOK_SECRET: app.env.FIRECRAWL_WEBHOOK_SECRET,
    FIRECRAWL_API_URL: app.env.FIRECRAWL_API_URL,
  },
});
app.use(betterAuth);

export default app;

