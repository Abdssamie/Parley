export interface CrawledCreatorProfile {
  name: string;
  bioLink: string;
  contactEmail: string;
  audienceNiche: string;
  brandFitScore: number;
  scrapedSummary: string;
  pastSponsors: string[];
  estimatedReach?: string;
  baseRate?: number;
  discoveredSubpages?: string[];
}

export interface FirecrawlMapResult {
  success: boolean;
  links: string[];
  mediaKitUrl?: string;
}
