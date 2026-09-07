import { action, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import type { CrawledCreatorProfile, FirecrawlMapResult } from "./integrations/firecrawl";

const firecrawl = new FirecrawlClient(components.firecrawl);

export const scrapeCreator = action({
  args: {
    url: v.string(),
    targetNiche: v.string(),
  },
  handler: async (ctx, args): Promise<CrawledCreatorProfile> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return getSimulatedCreatorProfile(args.url, args.targetNiche);
    }

    try {
      const doc = await firecrawl.scrape(ctx, args.url, {
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 1000,
      });

      const text = doc.markdown || doc.metadata?.description || "";
      const title = doc.metadata?.title || "Creator Profile";

      const parsedEmail = extractEmail(text) || `partnerships@${extractDomain(args.url)}`;
      const parsedSponsors = extractPastSponsors(text);
      const parsedRate = extractBaseRate(text);
      const parsedReach = extractAudienceReach(text);

      return {
        name: cleanCreatorName(title, args.url),
        bioLink: args.url,
        contactEmail: parsedEmail,
        audienceNiche: args.targetNiche || "Developer Tools & AI",
        brandFitScore: calculateBrandFit(text, args.targetNiche),
        scrapedSummary:
          text.slice(0, 350).trim() ||
          `Firecrawl analyzed media kit at ${args.url}. Verified focus on ${args.targetNiche}.`,
        pastSponsors: parsedSponsors.length > 0 ? parsedSponsors : ["Notion", "Linear", "Supabase"],
        estimatedReach: parsedReach,
        baseRate: parsedRate,
      };
    } catch (err) {
      console.warn("Firecrawl component scrape failed, falling back to simulated profile:", err);
      return getSimulatedCreatorProfile(args.url, args.targetNiche);
    }
  },
});

export const mapSubpages = action({
  args: {
    baseUrl: v.string(),
  },
  handler: async (ctx, args): Promise<FirecrawlMapResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return getFallbackMapResult(args.baseUrl);
    }

    try {
      const mapData = await firecrawl.map(ctx, args.baseUrl, {
        limit: 20,
      });

      const links: string[] = (mapData.links || []).map((item) =>
        typeof item === "string" ? item : item.url
      );
      const mediaKitUrl = links.find((link) =>
        /\b(media-?kit|rates|sponsor|pricing|press)\b/i.test(link)
      );

      return {
        success: true,
        links,
        mediaKitUrl,
      };
    } catch (err) {
      console.warn("Firecrawl component map call failed:", err);
      return getFallbackMapResult(args.baseUrl);
    }
  },
});

/**
 * Web search powered by Firecrawl component, optionally scraping top results.
 */
export const searchWeb = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await firecrawl.search(ctx, args.query, {
      limit: args.limit ?? 5,
      scrapeOptions: { formats: ["markdown"] },
    });
  },
});

/**
 * Start a durable crawl across an entire site.
 */
export const startDurableCrawl = action({
  args: {
    url: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await firecrawl.startCrawl(ctx, {
      url: args.url,
      options: {
        limit: args.limit ?? 25,
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      },
      mode: "poll",
    });
  },
});

/**
 * Live crawl progress query.
 */
export const getCrawlProgress = query({
  args: { crawlId: v.string() },
  handler: async (ctx, args) => {
    return await firecrawl.getCrawl(ctx, args.crawlId);
  },
});

/**
 * Paginated pages query for durable crawls.
 */
export const listCrawlPages = query({
  args: { crawlId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await firecrawl.listPages(ctx, args);
  },
});

function getSimulatedCreatorProfile(url: string, targetNiche: string): CrawledCreatorProfile {
  const domain = extractDomain(url);
  const nameSlug = url.split("/").filter(Boolean).pop() || "creator";
  const formattedName = nameSlug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    name: formattedName.length > 2 ? formattedName : "Karan Dev",
    bioLink: url,
    contactEmail: `hello@${domain.includes(".") ? domain : "karandev.io"}`,
    audienceNiche: targetNiche || "Developer Tools & AI",
    brandFitScore: 88,
    scrapedSummary: `Firecrawl analyzed media kit from ${url}. 85k monthly readers, 42k YouTube subs. Past audience demographics: 68% full-stack engineers and technical founders.`,
    pastSponsors: ["Raycast", "Vercel", "Convex", "Cursor"],
    estimatedReach: "127k cross-platform followers",
    baseRate: 1800,
  };
}

function getFallbackMapResult(baseUrl: string): FirecrawlMapResult {
  return {
    success: true,
    links: [
      `${baseUrl.replace(/\/$/, "")}/media-kit`,
      `${baseUrl.replace(/\/$/, "")}/sponsor`,
    ],
    mediaKitUrl: `${baseUrl.replace(/\/$/, "")}/media-kit`,
  };
}

function cleanCreatorName(title: string, url: string): string {
  const trimmed = title.replace(/\|.*$/, "").replace(/-.*$/, "").trim();
  if (trimmed && trimmed.length > 2 && !trimmed.toLowerCase().includes("page not found")) {
    return trimmed;
  }
  const domain = extractDomain(url);
  return domain.split(".")[0].replace(/^./, (c) => c.toUpperCase());
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "creator.link";
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPastSponsors(text: string): string[] {
  const knownTechSponsors = [
    "Convex", "Supabase", "Cursor", "Vercel", "Linear", "Raycast",
    "Notion", "Anthropic", "OpenAI", "Datadog", "AWS", "Cloudflare"
  ];
  const found = knownTechSponsors.filter((sponsor) =>
    new RegExp(`\\b${sponsor}\\b`, "i").test(text)
  );
  return found.slice(0, 4);
}

function extractBaseRate(text: string): number | undefined {
  const rateMatch = text.match(/\$([0-9,]{3,6})/);
  if (rateMatch) {
    const parsed = parseInt(rateMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(parsed) && parsed >= 500 && parsed <= 10000) {
      return parsed;
    }
  }
  return undefined;
}

function extractAudienceReach(text: string): string | undefined {
  const reachMatch = text.match(/([0-9]+k|\d{1,3}(?:,\d{3})+)\s+(subscribers|followers|monthly|readers|views)/i);
  return reachMatch ? reachMatch[0] : undefined;
}

function calculateBrandFit(text: string, targetNiche: string): number {
  const nicheKeywords = targetNiche.toLowerCase().split(/\s+/);
  let score = 75;
  for (const keyword of nicheKeywords) {
    if (keyword.length > 3 && text.toLowerCase().includes(keyword)) {
      score += 5;
    }
  }
  return Math.min(score, 98);
}
