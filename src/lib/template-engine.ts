import type { Doc } from "../../convex/_generated/dataModel"

export interface TemplateVariable {
  key: string
  tag: string
  label: string
  category: "creator" | "campaign" | "sender" | "brand"
  description: string
  example: string
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  // Creator Variables
  {
    key: "creator.name",
    tag: "{{creator.name}}",
    label: "Creator Name",
    category: "creator",
    description: "Full name of the creator or channel title",
    example: "Alex Rivera",
  },
  {
    key: "creator.platform",
    tag: "{{creator.platform}}",
    label: "Primary Platform",
    category: "creator",
    description: "YouTube, Twitter, TikTok, Instagram, Substack, etc.",
    example: "YouTube",
  },
  {
    key: "creator.email",
    tag: "{{creator.email}}",
    label: "Creator Email",
    category: "creator",
    description: "Contact or business inquiry email address",
    example: "alex@creatorspace.io",
  },
  {
    key: "creator.niche",
    tag: "{{creator.niche}}",
    label: "Audience Niche",
    category: "creator",
    description: "Content niche and audience focus",
    example: "AI Tools & Tech",
  },
  {
    key: "creator.followers",
    tag: "{{creator.followers}}",
    label: "Followers / Subscribers",
    category: "creator",
    description: "Total follower or subscriber count",
    example: "125,000",
  },
  {
    key: "creator.views",
    tag: "{{creator.views}}",
    label: "Average Views",
    category: "creator",
    description: "Average view benchmark per video or post",
    example: "45,000",
  },
  {
    key: "creator.rate",
    tag: "{{creator.rate}}",
    label: "Proposed / Estimated Rate",
    category: "creator",
    description: "Estimated cost or proposed sponsorship fee",
    example: "$1,500",
  },
  {
    key: "creator.country",
    tag: "{{creator.country}}",
    label: "Creator Country",
    category: "creator",
    description: "Country of primary audience or residence",
    example: "United States",
  },
  {
    key: "creator.brandFit",
    tag: "{{creator.brandFit}}",
    label: "Brand Fit Score",
    category: "creator",
    description: "Calculated brand match score percentage",
    example: "94%",
  },
  {
    key: "creator.bioLink",
    tag: "{{creator.bioLink}}",
    label: "Media Kit / Profile Link",
    category: "creator",
    description: "URL to portfolio, channel, or Linktree",
    example: "https://youtube.com/@alexrivera",
  },
  {
    key: "creator.summary",
    tag: "{{creator.summary}}",
    label: "Scraped Summary",
    category: "creator",
    description: "AI summary of recent content and brand style",
    example: "Top-tier technical deep-dives and weekly tutorials.",
  },

  // Campaign Variables
  {
    key: "campaign.title",
    tag: "{{campaign.title}}",
    label: "Campaign Title",
    category: "campaign",
    description: "Official title of the sponsoring campaign",
    example: "Parley Q4 AI Spotlight",
  },
  {
    key: "campaign.budget",
    tag: "{{campaign.budget}}",
    label: "Campaign Budget",
    category: "campaign",
    description: "Total allocated budget for the campaign",
    example: "$25,000",
  },
  {
    key: "campaign.currency",
    tag: "{{campaign.currency}}",
    label: "Currency",
    category: "campaign",
    description: "Campaign currency code (e.g. USD, EUR, GBP)",
    example: "USD",
  },
  {
    key: "campaign.targetNiche",
    tag: "{{campaign.targetNiche}}",
    label: "Target Niche",
    category: "campaign",
    description: "Target market niche or demographic",
    example: "Software Developers & Startups",
  },
  {
    key: "campaign.deliverables",
    tag: "{{campaign.deliverables}}",
    label: "Deliverables Required",
    category: "campaign",
    description: "Expected deliverables (e.g. 1x 60s Integration)",
    example: "1x 60s Dedicated Segment + Link in Bio",
  },
  {
    key: "campaign.brief",
    tag: "{{campaign.brief}}",
    label: "Campaign Brief Summary",
    category: "campaign",
    description: "Summary brief outlining the campaign goals",
    example: "Highlight autonomous creator outreach and negotiation workflows.",
  },
  {
    key: "campaign.startDate",
    tag: "{{campaign.startDate}}",
    label: "Start Date",
    category: "campaign",
    description: "Target kick-off or launch date",
    example: "Nov 01, 2026",
  },
  {
    key: "campaign.endDate",
    tag: "{{campaign.endDate}}",
    label: "End Date",
    category: "campaign",
    description: "Campaign wrap-up or deliverable due date",
    example: "Dec 15, 2026",
  },

  // Sender & Brand Variables
  {
    key: "sender.name",
    tag: "{{sender.name}}",
    label: "Sender Name",
    category: "sender",
    description: "Your full name or current user name",
    example: "Sarah Jenkins",
  },
  {
    key: "sender.email",
    tag: "{{sender.email}}",
    label: "Sender Email",
    category: "sender",
    description: "Your account or case outreach email",
    example: "sarah@parley.app",
  },
  {
    key: "brand.name",
    tag: "{{brand.name}}",
    label: "Brand / Company Name",
    category: "brand",
    description: "Name of the sponsor brand or app",
    example: "Parley",
  },
]

export interface TemplateContext {
  creator?: Partial<Doc<"creators">> | null
  campaign?: Partial<Doc<"campaigns">> | null
  sender?: {
    name?: string | null
    email?: string | null
  } | null
  brandName?: string
  customOverrides?: Record<string, string>
}

/**
 * Formats a number with comma separators.
 */
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return ""
  return new Intl.NumberFormat("en-US").format(num)
}

/**
 * Formats a currency value.
 */
function formatCurrency(amount: number | undefined, currency = "USD"): string {
  if (amount === undefined || amount === null) return ""
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Resolves a dictionary of dynamic variable values for a given context.
 */
export function buildVariableMap(context: TemplateContext): Record<string, string> {
  const creator = context.creator
  const campaign = context.campaign
  const sender = context.sender
  const brandName = context.brandName || "Parley"

  const map: Record<string, string> = {
    // Creator variables
    "creator.name": creator?.name || "[Creator Name]",
    "creator.platform": creator?.platform ? creator.platform.charAt(0).toUpperCase() + creator.platform.slice(1) : "[Platform]",
    "creator.email": creator?.email || "[Creator Email]",
    "creator.niche": creator?.audienceNiche || "[Audience Niche]",
    "creator.followers": creator?.followers ? formatNumber(creator.followers) : "[Followers]",
    "creator.views": creator?.views ? formatNumber(creator.views) : "[Avg Views]",
    "creator.rate": creator?.estCost
      ? formatCurrency(creator.estCost, campaign?.currency || "USD")
      : "[Proposed Rate]",
    "creator.country": creator?.country || "[Country]",
    "creator.brandFit": creator?.brandFitScore !== undefined ? `${creator.brandFitScore}%` : "[Brand Fit]",
    "creator.bioLink": creator?.bioLink || "[Profile Link]",
    "creator.summary": creator?.scrapedSummary || "[Creator Summary]",

    // Campaign variables
    "campaign.title": campaign?.title || "[Campaign Title]",
    "campaign.budget": campaign?.budget
      ? formatCurrency(campaign.budget, campaign?.currency || "USD")
      : "[Budget]",
    "campaign.currency": campaign?.currency || "USD",
    "campaign.targetNiche": campaign?.targetNiche || "[Target Niche]",
    "campaign.deliverables": campaign?.deliverableRequirements || "[Deliverable Requirements]",
    "campaign.brief": campaign?.brief || "[Campaign Brief]",
    "campaign.startDate": campaign?.startDate || "[Start Date]",
    "campaign.endDate": campaign?.endDate || "[End Date]",

    // Sender & Brand variables
    "sender.name": sender?.name || "Parley Partnerships",
    "sender.email": sender?.email || "partnerships@parley.app",
    "brand.name": brandName,
  }

  if (context.customOverrides) {
    Object.assign(map, context.customOverrides)
  }

  return map
}

/**
 * Renders an email template text by substituting all {{variable.key}} tokens.
 */
export function renderTemplate(text: string, context: TemplateContext): string {
  if (!text) return ""
  const varMap = buildVariableMap(context)

  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(varMap, key)) {
      return varMap[key]
    }
    return match
  })
}

/**
 * Extracts all unique {{variables}} found within a text.
 */
export function extractVariables(text: string): string[] {
  if (!text) return []
  const matches = text.match(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)
  if (!matches) return []
  const set = new Set<string>()
  for (const m of matches) {
    set.add(m.trim())
  }
  return Array.from(set)
}
