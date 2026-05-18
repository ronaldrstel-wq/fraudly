import { CUSTOMER_EXPERIENCE_REVIEW_NOTE } from "@/lib/scoring/establishedWebshop";
import type { SiteClassification, SiteRiskDimensions, RiskLevel } from "@/lib/siteClassification/types";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScoreSignal } from "@/lib/scoringEngine";
import { hasThreatFeedScamHit } from "@/lib/scoring/establishedWebshop";

export const LIMITED_HISTORY_WARNING =
  "This website is relatively new, so there is limited public history.";

function riskFromScore(finalRisk: number, confirmedMalicious: boolean): RiskLevel {
  if (confirmedMalicious) return "high";
  if (finalRisk >= 70) return "high";
  if (finalRisk >= 50) return "elevated";
  if (finalRisk >= 32) return "moderate";
  return "low";
}

function shoppingRisk(args: {
  classification: SiteClassification;
  finalRisk: number;
  ageDays: number | null;
  confirmedMalicious: boolean;
  webshopPolicyWeak: boolean;
}): RiskLevel {
  if (!args.classification.isWebshop) return "low";
  if (args.confirmedMalicious) return "high";
  const young = typeof args.ageDays === "number" && args.ageDays < 365;
  const w = args.classification.webshop;
  if (young && (w.discountHeavy || args.webshopPolicyWeak) && args.finalRisk >= 45) return "high";
  if (young || w.missingContactOrPolicies || w.discountHeavy) {
    if (args.finalRisk >= 38) return "elevated";
    return "moderate";
  }
  if (args.finalRisk >= 55) return "moderate";
  return "low";
}

function reputationRisk(reviewSignals: ReviewSignals | undefined): RiskLevel {
  if (!reviewSignals) return "low";
  const ratings: number[] = [];
  if (reviewSignals.googleFound && reviewSignals.googleRating != null) ratings.push(reviewSignals.googleRating);
  if (reviewSignals.trustpilotFound && reviewSignals.trustpilotRating != null) {
    ratings.push(reviewSignals.trustpilotRating);
  }
  if (!ratings.length) return "low";
  const worst = Math.min(...ratings);
  if (worst <= 2.5) return "elevated";
  if (worst < 3.5) return "moderate";
  return "low";
}

function hasPoorReviews(reviewSignals: ReviewSignals | undefined): boolean {
  if (!reviewSignals) return false;
  const poor = (r: number | undefined) => r != null && r <= 3.2;
  return poor(reviewSignals.googleRating) || poor(reviewSignals.trustpilotRating);
}

export function buildSiteRiskDimensions(args: {
  classification: SiteClassification;
  finalRisk: number;
  signals: ScoreSignal[];
  reviewSignals?: ReviewSignals;
  confirmedMalicious: boolean;
  ageDays: number | null;
  lexicalStrong: boolean;
}): SiteRiskDimensions {
  const feedHit = hasThreatFeedScamHit(args.signals) || args.confirmedMalicious;
  const scamRiskLevel = feedHit || args.lexicalStrong ? "high" : riskFromScore(args.finalRisk, args.confirmedMalicious);

  const webshopPolicyWeak =
    args.classification.isWebshop &&
    args.classification.webshop.missingContactOrPolicies &&
    !args.classification.webshop.hasShippingReturns;

  const shoppingRiskLevel = shoppingRisk({
    classification: args.classification,
    finalRisk: args.finalRisk,
    ageDays: args.ageDays,
    confirmedMalicious: args.confirmedMalicious,
    webshopPolicyWeak
  });

  const reputationRiskLevel = reputationRisk(args.reviewSignals);
  const customerExperienceWarning = hasPoorReviews(args.reviewSignals) ? CUSTOMER_EXPERIENCE_REVIEW_NOTE : null;

  const limitedHistoryWarning =
    typeof args.ageDays === "number" && args.ageDays < 180 && !feedHit
      ? LIMITED_HISTORY_WARNING
      : null;

  return {
    siteType: args.classification.siteType,
    scamRiskLevel,
    shoppingRiskLevel,
    reputationRiskLevel,
    customerExperienceWarning,
    limitedHistoryWarning
  };
}
