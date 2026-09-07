import { createAuthClient } from "better-auth/react";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";

const convexUrl =
  import.meta.env.VITE_CONVEX_URL || "https://disciplined-greyhound-279.eu-west-1.convex.cloud";

const convexSiteUrl =
  import.meta.env.VITE_CONVEX_SITE_URL ||
  convexUrl.replace(/\.cloud$/, ".site");

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient(), crossDomainClient()],
});
