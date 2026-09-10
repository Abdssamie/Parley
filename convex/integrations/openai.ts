"use node";

export interface ExtractedNegotiationIntent {
  intent: "counter_offer" | "accept" | "decline" | "question";
  requestedRate: number | null;
  proposedDeliverables: string[];
  timelineConstraint: string | null;
  sentimentScore: number; // 1-10 (flags hostility/ghosting risk)
  counterOfferDraft?: string;
  reasoning?: string;
}

export interface NegotiationAnalysis extends ExtractedNegotiationIntent {
  proposedFee: number;
  withinBudget: boolean;
  needsApproval: boolean;
  recommendedStage: "negotiating" | "review_required" | "accepted" | "declined";
  draftReply: string;
}

export async function analyzeAndDraftNegotiation(params: {
  campaignTitle: string;
  budget: number;
  deliverableRequirements: string;
  creatorName: string;
  incomingMessage: string;
  previousProposedFee: number;
}): Promise<NegotiationAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are Parley, an autonomous sponsorship negotiator representing a marketing team.
Campaign: "${params.campaignTitle}"
Deliverable Requirements: "${params.deliverableRequirements}"
Campaign Budget: $${params.budget} USD
Current Creator Name: "${params.creatorName}"
Previous Proposed Fee: $${params.previousProposedFee} USD

Creator's Incoming Email Message:
"""
${params.incomingMessage}
"""

Analyze the creator's incoming email and return a Structured Output JSON with:
1. "intent": "counter_offer" | "accept" | "decline" | "question"
2. "requestedRate": creator's proposed fee as an integer number in USD, or null if no rate mentioned.
3. "proposedDeliverables": string array of deliverables mentioned or agreed by the creator.
4. "timelineConstraint": string description of dates/timelines mentioned (e.g. "Next month", "October 14th"), or null.
5. "sentimentScore": integer 1-10 where 10 is eager/delighted, 7 is standard professional, 4 is hesitant/friction, 1-2 is hostile/refusal.
6. "draftReply": a professional, courteous reply from the Parley team. If rate <= $${params.budget}, confirm enthusiastically and include next onboarding steps. If rate > $${params.budget} but <= $${Math.round(params.budget * 1.25)}, propose a counter-offer anchored to $${params.budget} or adjust deliverables. If rate > $${Math.round(params.budget * 1.25)}, write a polite counter or note requiring review.
7. "reasoning": 1-2 sentences summarizing negotiation dynamics and risk.

Respond ONLY with a valid JSON object matching this schema.`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const rawJson = data.choices[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson) as {
            intent: "counter_offer" | "accept" | "decline" | "question";
            requestedRate: number | null;
            proposedDeliverables: string[];
            timelineConstraint: string | null;
            sentimentScore: number;
            draftReply: string;
            reasoning: string;
          };

          const effectiveFee = parsed.requestedRate ?? params.previousProposedFee;
          const withinBudget = effectiveFee <= params.budget;
          const exceeds125 = effectiveFee > params.budget * 1.25;
          const needsApproval = exceeds125 || (parsed.sentimentScore ?? 7) <= 4;

          let recommendedStage: "negotiating" | "review_required" | "accepted" | "declined" = "negotiating";
          if (parsed.intent === "decline") {
            recommendedStage = "declined";
          } else if (withinBudget && parsed.intent === "accept") {
            recommendedStage = "accepted";
          } else if (needsApproval) {
            recommendedStage = "review_required";
          }

          return {
            intent: parsed.intent || "counter_offer",
            requestedRate: parsed.requestedRate,
            proposedDeliverables: Array.isArray(parsed.proposedDeliverables)
              ? parsed.proposedDeliverables
              : [params.deliverableRequirements],
            timelineConstraint: parsed.timelineConstraint ?? null,
            sentimentScore: typeof parsed.sentimentScore === "number" ? parsed.sentimentScore : 7,
            proposedFee: effectiveFee,
            withinBudget,
            needsApproval,
            recommendedStage,
            draftReply: parsed.draftReply,
            reasoning: parsed.reasoning,
            counterOfferDraft: parsed.draftReply,
          };
        }
      }
    } catch (err) {
      console.warn("OpenAI live call failed, falling back to simulated analysis:", err);
    }
  }

  // Resilient heuristic parser fallback
  const lower = params.incomingMessage.toLowerCase();
  const dollarMatch = params.incomingMessage.match(/\$([0-9,]+)/);
  const parsedFee: number | null = dollarMatch
    ? parseInt(dollarMatch[1].replace(/,/g, ""), 10)
    : null;

  // 1. Decline detection
  if (
    lower.includes("pass") ||
    lower.includes("not interested") ||
    lower.includes("decline") ||
    lower.includes("cannot commit") ||
    lower.includes("fully booked")
  ) {
    return {
      intent: "decline",
      requestedRate: parsedFee,
      proposedDeliverables: [],
      timelineConstraint: null,
      sentimentScore: 3,
      proposedFee: 0,
      withinBudget: true,
      needsApproval: false,
      recommendedStage: "declined",
      draftReply: `Hi ${params.creatorName},\n\nCompletely understand! Thank you for letting us know promptly. We'll keep you in mind for future campaigns when our schedules might align better.\n\nBest regards,\nParley Sponsorships Team`,
      reasoning: "Creator stated they cannot participate or passed on the opportunity.",
    };
  }

  // 2. Acceptance detection
  if (
    lower.includes("sounds great") ||
    lower.includes("deal") ||
    lower.includes("send the contract") ||
    lower.includes("happy to proceed") ||
    lower.includes("lock it in") ||
    (parsedFee !== null && parsedFee <= params.budget && lower.includes("can do"))
  ) {
    const finalFee = parsedFee ? Math.min(parsedFee, params.budget) : params.previousProposedFee;
    return {
      intent: "accept",
      requestedRate: finalFee,
      proposedDeliverables: [params.deliverableRequirements],
      timelineConstraint: "Target launch window",
      sentimentScore: 9,
      proposedFee: finalFee,
      withinBudget: true,
      needsApproval: false,
      recommendedStage: "accepted",
      draftReply: `Hi ${params.creatorName},\n\nFantastic news! We are thrilled to partner on "${params.campaignTitle}". I have locked in the agreed fee of $${finalFee.toLocaleString()} for ${params.deliverableRequirements}.\n\nOur onboarding and contract link is ready here: https://parley.app/onboard?creator=${encodeURIComponent(params.creatorName)}\n\nLooking forward to working together!\n\nBest regards,\nParley Team`,
      reasoning: "Creator agreed to terms within campaign budget parameters.",
    };
  }

  // 3. Question / Inquiry detection
  if (
    (lower.includes("could you tell me") ||
      lower.includes("what is the timeline") ||
      lower.includes("how does payment work")) &&
    parsedFee === null
  ) {
    return {
      intent: "question",
      requestedRate: null,
      proposedDeliverables: [params.deliverableRequirements],
      timelineConstraint: null,
      sentimentScore: 7,
      proposedFee: params.previousProposedFee,
      withinBudget: true,
      needsApproval: false,
      recommendedStage: "negotiating",
      draftReply: `Hi ${params.creatorName},\n\nGreat question! Our campaign timeline targets deliverables within the upcoming cycle, and payments are settled on net-15 upon asset approval. Does that align with your schedule?\n\nBest,\nParley Team`,
      reasoning: "Creator inquired about campaign details without submitting a counter rate.",
    };
  }

  // 4. Counter-Offer detection
  const requested = parsedFee ?? params.previousProposedFee;
  const isHardBlock = requested > params.budget * 1.25;

  if (isHardBlock) {
    return {
      intent: "counter_offer",
      requestedRate: requested,
      proposedDeliverables: [params.deliverableRequirements],
      timelineConstraint: null,
      sentimentScore: 5,
      proposedFee: requested,
      withinBudget: false,
      needsApproval: true,
      recommendedStage: "review_required",
      draftReply: `Hi ${params.creatorName},\n\nThank you for sharing your rate card. $${requested.toLocaleString()} is considerably above our campaign budget cap of $${params.budget.toLocaleString()} for this milestone.\n\nCould we explore doing a single focused segment, or anchor closer to $${params.budget.toLocaleString()}? Let us know what might be feasible.\n\nBest regards,\nParley Partnerships Team`,
      reasoning: `Requested fee of $${requested.toLocaleString()} exceeds 125% of campaign budget ($${params.budget.toLocaleString()}). Flagged for Human Approval Gate.`,
      counterOfferDraft: `Hi ${params.creatorName},\n\nThank you for sharing your rate card. $${requested.toLocaleString()} is considerably above our campaign budget cap of $${params.budget.toLocaleString()} for this milestone.\n\nCould we explore doing a single focused segment, or anchor closer to $${params.budget.toLocaleString()}? Let us know what might be feasible.\n\nBest regards,\nParley Partnerships Team`,
    };
  }

  // Rule B: Rate > maxBudget but within 125%
  if (requested > params.budget) {
    return {
      intent: "counter_offer",
      requestedRate: requested,
      proposedDeliverables: [params.deliverableRequirements],
      timelineConstraint: null,
      sentimentScore: 7,
      proposedFee: requested,
      withinBudget: false,
      needsApproval: false,
      recommendedStage: "negotiating",
      draftReply: `Hi ${params.creatorName},\n\nThanks for getting back to us! While $${requested.toLocaleString()} is slightly above our allocated cap of $${params.budget.toLocaleString()}, we really want to make this collaboration happen.\n\nWould you be open to $${params.budget.toLocaleString()} flat, or alternatively adjusting the scope (e.g. 1 dedicated segment)? Let us know your thoughts!\n\nBest,\nParley Partnerships Team`,
      reasoning: `Requested $${requested.toLocaleString()} is within 125% of budget. Drafted counter-offer anchored to $${params.budget.toLocaleString()}.`,
      counterOfferDraft: `Hi ${params.creatorName},\n\nThanks for getting back to us! While $${requested.toLocaleString()} is slightly above our allocated cap of $${params.budget.toLocaleString()}, we really want to make this collaboration happen.\n\nWould you be open to $${params.budget.toLocaleString()} flat, or alternatively adjusting the scope (e.g. 1 dedicated segment)? Let us know your thoughts!\n\nBest,\nParley Partnerships Team`,
    };
  }

  // Within budget counter or proposal
  return {
    intent: "counter_offer",
    requestedRate: requested,
    proposedDeliverables: [params.deliverableRequirements],
    timelineConstraint: null,
    sentimentScore: 8,
    proposedFee: requested,
    withinBudget: true,
    needsApproval: false,
    recommendedStage: "negotiating",
    draftReply: `Hi ${params.creatorName},\n\nThanks for the reply! $${requested.toLocaleString()} works nicely within our parameters for "${params.campaignTitle}". Could you confirm your earliest available production date for ${params.deliverableRequirements}?\n\nBest regards,\nParley Team`,
    reasoning: `Creator proposed $${requested.toLocaleString()}, which is within the $${params.budget.toLocaleString()} budget.`,
  };
}
