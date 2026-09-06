"use node";

export interface NegotiationAnalysis {
  extractedIntent: string;
  proposedFee: number;
  withinBudget: boolean;
  needsApproval: boolean;
  recommendedStage: "negotiating" | "accepted" | "declined";
  draftReply: string;
  reasoning: string;
}

export async function analyzeAndDraftNegotiation(params: {
  campaignTitle: string;
  budgetCap: number;
  deliverableRequirements: string;
  creatorName: string;
  incomingMessage: string;
  previousProposedFee: number;
}): Promise<NegotiationAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are CollabAgent, an autonomous sponsorship negotiator representing a marketing team.
Campaign: "${params.campaignTitle}"
Deliverable Requirements: "${params.deliverableRequirements}"
Maximum Budget Cap: $${params.budgetCap} USD
Current Creator Name: "${params.creatorName}"
Previous Proposed Fee: $${params.previousProposedFee} USD

Creator's Incoming Email Message:
"""
${params.incomingMessage}
"""

Analyze the creator's message.
1. Extract their proposed fee as an integer number (in USD). If not mentioned, estimate or retain previous.
2. Determine if it is within our $${params.budgetCap} budget.
3. If they ask more than $${params.budgetCap}, draft a polite counter-offer capped at $${params.budgetCap} or ask for revised deliverables, and set needsApproval=true.
4. If they accept or offer <= $${params.budgetCap}, set needsApproval=false and draft a warm confirmation.
5. If they strictly decline, set recommendedStage="declined".

Respond ONLY with valid JSON in this structure:
{
  "extractedIntent": "rate_counter | agreement | decline | general_inquiry",
  "proposedFee": number,
  "withinBudget": boolean,
  "needsApproval": boolean,
  "recommendedStage": "negotiating | accepted | declined",
  "draftReply": "contextual reply email text",
  "reasoning": "short explanation of strategy"
}`;

      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const rawJson = data.choices[0]?.message?.content;
        if (rawJson) {
          const parsed = JSON.parse(rawJson) as NegotiationAnalysis;
          return parsed;
        }
      }
    } catch (err) {
      console.warn("OpenAI live call failed, falling back to simulated analysis:", err);
    }
  }

  // Simulated fallback negotiation logic
  const lower = params.incomingMessage.toLowerCase();
  const dollarMatch = params.incomingMessage.match(/\$([0-9,]+)/);
  let parsedFee = dollarMatch
    ? parseInt(dollarMatch[1].replace(/,/g, ""), 10)
    : params.previousProposedFee || 1500;

  if (lower.includes("pass") || lower.includes("not interested") || lower.includes("decline")) {
    return {
      extractedIntent: "decline",
      proposedFee: 0,
      withinBudget: true,
      needsApproval: false,
      recommendedStage: "declined",
      draftReply: `Hi ${params.creatorName}, completely understand. Thanks for letting us know, and we'll keep you in mind for future campaigns! Best, CollabAgent Team.`,
      reasoning: "Creator declined the sponsorship opportunity.",
    };
  }

  if (lower.includes("sounds great") || lower.includes("deal") || lower.includes("send the contract") || lower.includes("happy to proceed")) {
    return {
      extractedIntent: "agreement",
      proposedFee: Math.min(parsedFee, params.budgetCap),
      withinBudget: true,
      needsApproval: false,
      recommendedStage: "accepted",
      draftReply: `Fantastic, ${params.creatorName}! We're thrilled to partner on ${params.campaignTitle}. I have locked in the agreed fee of $${Math.min(parsedFee, params.budgetCap).toLocaleString()} for ${params.deliverableRequirements}. Our legal team will dispatch the agreement shortly.`,
      reasoning: "Creator accepted the proposal within budget parameters.",
    };
  }

  const exceedsBudget = parsedFee > params.budgetCap;
  if (exceedsBudget) {
    return {
      extractedIntent: "rate_counter_exceeds_budget",
      proposedFee: parsedFee,
      withinBudget: false,
      needsApproval: true,
      recommendedStage: "negotiating",
      draftReply: `Hi ${params.creatorName}, thanks for getting back to us. While $${parsedFee.toLocaleString()} is above our cap of $${params.budgetCap.toLocaleString()} for this specific milestone, we'd love to make this work. Would you consider $${params.budgetCap.toLocaleString()} or alternatively adjusting deliverables to 1 dedicated segment? Let us know what you think!`,
      reasoning: `Creator requested $${parsedFee.toLocaleString()}, which exceeds campaign cap of $${params.budgetCap.toLocaleString()}. Autonomous counter drafted and flagged for human approval.`,
    };
  }

  return {
    extractedIntent: "rate_proposal_within_budget",
    proposedFee: parsedFee,
    withinBudget: true,
    needsApproval: false,
    recommendedStage: "negotiating",
    draftReply: `Hi ${params.creatorName}, thanks for your rate card! $${parsedFee.toLocaleString()} fits nicely within our parameters for ${params.campaignTitle}. Could you confirm your earliest publication date for ${params.deliverableRequirements}?`,
    reasoning: `Creator proposed $${parsedFee.toLocaleString()}, which is within the $${params.budgetCap.toLocaleString()} cap. Generated confirmation inquiry.`,
  };
}
