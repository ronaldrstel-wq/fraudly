import type { ReviewSignals } from "@/lib/reviewSignals";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";

export type ScoreConfidence = "low" | "medium" | "high";

export interface ScoreSignal {
  id: string;
  label: string;
  category:
    | "domain"
    | "reviews"
    | "supply_chain"
    | "business_identity"
    | "website_quality"
    | "ai";
  impact: number;
  confidence: ScoreConfidence;
  reason: string;
}

export interface ScoreResult {
  baseScore: number;
  finalScore: number;
  verdict: "safe" | "suspicious" | "scam";
  signals: ScoreSignal[];
  topPositiveSignals: ScoreSignal[];
  topNegativeSignals: ScoreSignal[];
}

export type AddressSignalsInput = {
  hasClearBusinessAddress?: boolean;
  hasKvK?: boolean;
  hasVat?: boolean;
};

export type DomainAgeSignalsInput = {
  ageDays?: number;
  ageYears?: number;
};

export type AiRiskSignalsInput = {
  level?: "low" | "medium" | "high";
};

const CONF_MULT: Record<ScoreConfidence, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1.0
};

const BASE_SCORE = 35;
const REVIEW_MAX_DOWN = 25;
const REVIEW_MAX_UP = 20;
const SUPPLY_MAX_UP = 30;
const LOCAL_MAX_DOWN = 20;
const DOMAIN_ONLY_SCORE_CAP = 70;

export function weightedImpact(signal: ScoreSignal): number {
  return signal.impact * CONF_MULT[signal.confidence];
}

/** Compact JSON for the AI prompt (numeric score is computed server-side only). */
export function formatScoreSignalsForPrompt(signals: ScoreSignal[]): string {
  return JSON.stringify(
    signals.map((s) => ({
      id: s.id,
      label: s.label,
      category: s.category,
      impact: s.impact,
      confidence: s.confidence,
      reason: s.reason
    }))
  );
}

function verdictFromScore(score: number): ScoreResult["verdict"] {
  if (score >= 70) return "scam";
  if (score >= 40) return "suspicious";
  return "safe";
}

/** Same narrative lines as legacy domain heuristics (for AI / UI copy). */
export function buildDomainHeuristicReasons(domain: string): string[] {
  const d = domain.toLowerCase();
  const reasons: string[] = [];
  const riskyKeywords = ["cheap", "free", "deal"];
  const matched = riskyKeywords.filter((word) => d.includes(word));
  if (matched.length > 0) {
    reasons.push(`Domain includes suspicious sales keywords: ${matched.join(", ")}.`);
  } else {
    reasons.push("No common bait keywords were found in the domain.");
  }
  if (d.length > 20) {
    reasons.push("The domain name is unusually long, a common phishing pattern.");
  } else {
    reasons.push("Domain length looks normal.");
  }
  if (d.split(".").length > 3) {
    reasons.push("Multiple subdomains detected, which can be used to imitate trusted brands.");
  }
  return reasons.slice(0, 3);
}

/**
 * Infer business-identity hints from fetched page text. When text is empty, returns neutral
 * (no "missing address" penalty — we cannot know).
 */
export function inferAddressSignals(websiteText: string): AddressSignalsInput {
  const t = websiteText.trim();
  if (!t) {
    return {};
  }
  const hasKvK = /\b(?:kvk|kamer\s*van\s*koophandel)\b/i.test(t) && /\b\d{8}\b/.test(t);
  const hasVat =
    /\b(?:btw|vat|uid)\s*[.:]?\s*(?:[A-Z]{2}[\d\s.-]{8,20}|[\d]{9,12})/i.test(t) ||
    /\b(?:NL\d{9}B\d{2}|BE0?\d{9}|DE\d{9})\b/i.test(t);
  const nlPostal = /\b\d{4}\s?[A-Z]{2}\b/.test(t);
  const streetish =
    /(?:straat|laan|weg|plein|avenue|street|road|boulevard|drive)\s+[\w.-]+\s+\d+/i.test(t) ||
    /\b(?:p\.?\s*o\.?\s*box|postbus)\b/i.test(t);
  const hasClearBusinessAddress = streetish || nlPostal;

  return { hasClearBusinessAddress, hasKvK, hasVat };
}

type ReviewTierFlags = { elitePositive: boolean; strongPublicReview: boolean };

function computeReviewTierFlags(review?: ReviewSignals): ReviewTierFlags {
  let elitePositive = false;
  let strongPublicReview = false;
  if (!review) return { elitePositive, strongPublicReview };

  const check = (found: boolean, rating?: number, count?: number) => {
    if (!found || rating == null || count == null) return;
    if (rating >= 4.3 && count >= 1000) elitePositive = true;
    if (rating >= 4.3 && count >= 100) strongPublicReview = true;
  };

  check(review.googleFound, review.googleRating, review.googleReviewCount);
  check(review.trustpilotFound, review.trustpilotRating, review.trustpilotReviewCount);

  return { elitePositive, strongPublicReview };
}

function pushDomainSignals(domain: string, out: ScoreSignal[]): void {
  const d = domain.toLowerCase();
  const risky = ["cheap", "free", "deal"];
  const matched = risky.filter((w) => d.includes(w));
  if (matched.length > 0) {
    out.push({
      id: "domain-sales-keywords",
      label: "Suspicious sales keywords in domain",
      category: "domain",
      impact: 15,
      confidence: "medium",
      reason: `Domain contains bait-style keywords: ${matched.join(", ")}.`
    });
  }
  if (d.length > 20) {
    out.push({
      id: "domain-long",
      label: "Unusually long domain",
      category: "domain",
      impact: 10,
      confidence: "medium",
      reason: "The hostname is unusually long, which is common in phishing or throwaway shops."
    });
  }
  if (d.split(".").length > 3) {
    out.push({
      id: "domain-deep-labels",
      label: "Many hostname labels",
      category: "domain",
      impact: 10,
      confidence: "medium",
      reason: "Extra hostname segments can be used to mimic trusted brands."
    });
  }
}

/** Trust nudges for “clean” domains; omitted when strong public reviews already imply baseline trust. */
function pushDomainTrustSignals(domain: string, out: ScoreSignal[], tier: ReviewTierFlags): void {
  const d = domain.toLowerCase();
  const risky = ["cheap", "free", "deal"];
  const matched = risky.filter((w) => d.includes(w));
  const skipBaitAndLength = tier.strongPublicReview;

  if (matched.length === 0 && !skipBaitAndLength) {
    out.push({
      id: "domain-no-bait-keywords",
      label: "No bait keywords in domain",
      category: "domain",
      impact: -5,
      confidence: "medium",
      reason: "The domain does not contain common bait-style sales keywords."
    });
  }
  if (d.length > 0 && d.length <= 20 && !skipBaitAndLength) {
    out.push({
      id: "domain-normal-length",
      label: "Normal domain length",
      category: "domain",
      impact: -5,
      confidence: "low",
      reason: "Hostname length looks typical rather than excessively long."
    });
  }
}

function pushAiRiskSignals(level: AiRiskSignalsInput["level"], out: ScoreSignal[], tier: ReviewTierFlags): void {
  if (!level) return;
  if (level === "low" && !tier.elitePositive) {
    out.push({
      id: "ai-risk-low",
      label: "AI assessment: low risk",
      category: "ai",
      impact: -8,
      confidence: "medium",
      reason: "Model assessed overall URL risk as low (scoring only; score is computed from all signals)."
    });
  }
}

function pushReviewSignals(review: ReviewSignals, out: ScoreSignal[]): void {
  const addGoogle = () => {
    if (!review.googleFound || review.googleRating == null || review.googleReviewCount == null) {
      out.push({
        id: "reviews-google-none",
        label: "No matched Google listing",
        category: "reviews",
        impact: 0,
        confidence: "high",
        reason: "No Google Places listing matched this domain; review impact is neutral (not a penalty)."
      });
      return;
    }
    const r = review.googleRating;
    const c = review.googleReviewCount;
    if (r >= 4.3 && c >= 1000) {
      out.push({
        id: "reviews-google-elite-volume",
        label: "Elite Google rating volume",
        category: "reviews",
        impact: -25,
        confidence: "high",
        reason: `Google rating ${r.toFixed(1)} with ${c} reviews indicates a very well-established presence.`
      });
      return;
    }
    if (r >= 4.3 && c >= 100) {
      out.push({
        id: "reviews-google-strong-positive",
        label: "Strong Google rating volume",
        category: "reviews",
        impact: -20,
        confidence: "high",
        reason: `Google rating ${r.toFixed(1)} with ${c} reviews suggests established reputation.`
      });
      return;
    }
    if (r >= 4.0 && c >= 25) {
      out.push({
        id: "reviews-google-moderate-positive",
        label: "Moderate Google rating volume",
        category: "reviews",
        impact: -10,
        confidence: "medium",
        reason: `Google rating ${r.toFixed(1)} with ${c} reviews is mildly reassuring.`
      });
      return;
    }
    if (r <= 2.5 && c >= 10) {
      out.push({
        id: "reviews-google-poor",
        label: "Poor Google reviews",
        category: "reviews",
        impact: 20,
        confidence: "high",
        reason: `Google rating ${r.toFixed(1)} with ${c} reviews is a strong warning signal.`
      });
      return;
    }
    if (r <= 3.2 && c >= 25) {
      out.push({
        id: "reviews-google-weak",
        label: "Weak Google reviews",
        category: "reviews",
        impact: 10,
        confidence: "medium",
        reason: `Google rating ${r.toFixed(1)} with ${c} reviews is below typical trust levels.`
      });
    }
  };

  const addTrustpilot = () => {
    if (!review.trustpilotFound || review.trustpilotRating == null || review.trustpilotReviewCount == null) {
      return;
    }
    const r = review.trustpilotRating;
    const c = review.trustpilotReviewCount;
    if (r >= 4.3 && c >= 1000) {
      out.push({
        id: "reviews-trustpilot-elite-volume",
        label: "Elite Trustpilot rating volume",
        category: "reviews",
        impact: -25,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews indicates a very well-established presence.`
      });
    } else if (r >= 4.3 && c >= 100) {
      out.push({
        id: "reviews-trustpilot-strong-positive",
        label: "Strong Trustpilot rating volume",
        category: "reviews",
        impact: -20,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews suggests established reputation.`
      });
    } else if (r >= 4.0 && c >= 25) {
      out.push({
        id: "reviews-trustpilot-moderate-positive",
        label: "Moderate Trustpilot rating volume",
        category: "reviews",
        impact: -10,
        confidence: "medium",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is mildly reassuring.`
      });
    } else if (r <= 2.5 && c >= 10) {
      out.push({
        id: "reviews-trustpilot-poor",
        label: "Poor Trustpilot reviews",
        category: "reviews",
        impact: 20,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is a strong warning signal.`
      });
    } else if (r <= 3.2 && c >= 25) {
      out.push({
        id: "reviews-trustpilot-weak",
        label: "Weak Trustpilot reviews",
        category: "reviews",
        impact: 10,
        confidence: "medium",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is below typical trust levels.`
      });
    }
  };

  addGoogle();
  addTrustpilot();
}

function pushSupplyChainSignals(sc: SupplyChainSignals, out: ScoreSignal[], allowRiskIncrease: boolean): void {
  const china = sc.chinaConfidence ?? "low";
  const drop = sc.dropshipConfidence ?? "low";
  const loc = sc.localConfidence ?? "low";

  if (
    allowRiskIncrease &&
    sc.likelyChinaShipping &&
    (china === "medium" || china === "high")
  ) {
    const impact = china === "high" ? 25 : 15;
    const conf = china === "high" ? "high" : "medium";
    out.push({
      id: "supply-china-fulfillment",
      label: "China-linked fulfillment cues",
      category: "supply_chain",
      impact,
      confidence: conf,
      reason: "Site copy suggests China warehouses, marketplaces, or long cross-border fulfillment."
    });
  }

  if (allowRiskIncrease && sc.likelyDropshipping && (drop === "medium" || drop === "high")) {
    const impact = drop === "high" ? 20 : 10;
    const conf = drop === "high" ? "high" : "medium";
    out.push({
      id: "supply-dropshipping",
      label: "Dropshipping / long fulfillment pattern",
      category: "supply_chain",
      impact,
      confidence: conf,
      reason: "Shipping windows or copy patterns resemble dropshipping rather than local stock."
    });
  }

  if (sc.likelyLocalProduction && (loc === "medium" || loc === "high")) {
    const impact = loc === "high" ? -15 : -8;
    const conf = loc === "high" ? "high" : "medium";
    out.push({
      id: "supply-local-stock",
      label: "Local / EU production or stock signals",
      category: "supply_chain",
      impact,
      confidence: conf,
      reason: "Copy suggests local production, EU origin, or fast domestic fulfillment."
    });
  }
}

function pushBusinessIdentitySignals(addr: AddressSignalsInput | undefined, websiteText: string, out: ScoreSignal[]): void {
  const t = websiteText.trim();
  const hasData = t.length >= 180;

  if (addr?.hasKvK) {
    out.push({
      id: "biz-kvk",
      label: "KvK / Chamber of Commerce reference",
      category: "business_identity",
      impact: -10,
      confidence: "high",
      reason: "A Dutch KvK-style identifier appears in the captured page text."
    });
  }
  if (addr?.hasVat) {
    out.push({
      id: "biz-vat",
      label: "VAT / tax identifier",
      category: "business_identity",
      impact: -8,
      confidence: "high",
      reason: "A VAT-style tax identifier appears in the captured page text."
    });
  }
  if (hasData && addr && addr.hasClearBusinessAddress === false) {
    out.push({
      id: "biz-no-address",
      label: "No clear business address in snippet",
      category: "business_identity",
      impact: 15,
      confidence: "medium",
      reason: "Enough text was captured but no obvious physical business or return address was found."
    });
  }
}

function pushDomainAgeSignals(age: DomainAgeSignalsInput | undefined, out: ScoreSignal[]): void {
  if (!age) return;
  if (typeof age.ageDays === "number" && age.ageDays >= 0 && age.ageDays < 30) {
    out.push({
      id: "domain-age-very-new",
      label: "Very new domain registration",
      category: "domain",
      impact: 25,
      confidence: "high",
      reason: `Domain age is about ${age.ageDays} days, which is common for short-lived scam shops.`
    });
  } else if (typeof age.ageYears === "number" && age.ageYears > 3) {
    out.push({
      id: "domain-age-established",
      label: "Established domain age",
      category: "domain",
      impact: -8,
      confidence: "medium",
      reason: `Domain appears older than ${age.ageYears.toFixed(1)} years, slightly reducing throwaway risk.`
    });
  }
}

function scaleCategoryWeights(
  signals: ScoreSignal[],
  category: ScoreSignal["category"],
  maxPositive: number | null,
  maxNegativeMag: number | null
): Map<string, number> {
  const subset = signals.filter((s) => s.category === category);
  const weights = new Map<string, number>();
  for (const s of subset) {
    weights.set(s.id, weightedImpact(s));
  }
  let pos = 0;
  let neg = 0;
  for (const w of weights.values()) {
    if (w > 0) pos += w;
    else if (w < 0) neg += w;
  }
  let scaleP = 1;
  let scaleN = 1;
  if (maxPositive != null && pos > maxPositive) scaleP = maxPositive / pos;
  if (maxNegativeMag != null && neg < -maxNegativeMag) scaleN = -maxNegativeMag / neg;
  for (const s of subset) {
    const w = weights.get(s.id)!;
    const scale = w > 0 ? scaleP : w < 0 ? scaleN : 1;
    weights.set(s.id, w * scale);
  }
  return weights;
}

export function calculateScamScore(input: {
  domain: string;
  heuristicReasons: string[];
  reviewSignals?: ReviewSignals;
  supplyChainSignals?: SupplyChainSignals;
  addressSignals?: AddressSignalsInput;
  domainAgeSignals?: DomainAgeSignalsInput;
  aiRiskSignals?: AiRiskSignalsInput;
  externalSignals?: ScoreSignal[];
  /** Snippet used only for business-identity heuristics when addressSignals omit fields. */
  websiteText?: string;
}): ScoreResult {
  void input.heuristicReasons;

  const signals: ScoreSignal[] = [];
  const domain = input.domain.toLowerCase();
  const reviewTier = computeReviewTierFlags(input.reviewSignals);

  pushDomainSignals(domain, signals);
  if (input.reviewSignals) pushReviewSignals(input.reviewSignals, signals);
  if (input.supplyChainSignals) {
    const allowSupplyRisk = input.supplyChainSignals.scoreAdjustment > 0;
    pushSupplyChainSignals(input.supplyChainSignals, signals, allowSupplyRisk);
  }

  const inferredAddr = inferAddressSignals(input.websiteText ?? "");
  const addr: AddressSignalsInput = { ...inferredAddr, ...input.addressSignals };
  pushBusinessIdentitySignals(addr, input.websiteText ?? "", signals);
  pushDomainAgeSignals(input.domainAgeSignals, signals);
  pushDomainTrustSignals(domain, signals, reviewTier);
  pushAiRiskSignals(input.aiRiskSignals?.level, signals, reviewTier);
  if (input.externalSignals?.length) {
    signals.push(...input.externalSignals);
  }

  const reviewW = scaleCategoryWeights(signals, "reviews", REVIEW_MAX_UP, REVIEW_MAX_DOWN);

  const supplyRiskIds = new Set(["supply-china-fulfillment", "supply-dropshipping"]);
  const supplyLocalIds = new Set(["supply-local-stock"]);
  const supplyWeights = new Map<string, number>();
  for (const s of signals) {
    if (s.category !== "supply_chain") continue;
    supplyWeights.set(s.id, weightedImpact(s));
  }
  let supPos = 0;
  let supNeg = 0;
  for (const s of signals) {
    if (s.category !== "supply_chain") continue;
    const w = supplyWeights.get(s.id)!;
    if (supplyRiskIds.has(s.id) && w > 0) supPos += w;
    if (supplyLocalIds.has(s.id) && w < 0) supNeg += w;
  }
  let scaleSupP = 1;
  let scaleSupN = 1;
  if (supPos > SUPPLY_MAX_UP) scaleSupP = SUPPLY_MAX_UP / supPos;
  if (supNeg < -LOCAL_MAX_DOWN) scaleSupN = -LOCAL_MAX_DOWN / supNeg;
  for (const s of signals) {
    if (s.category !== "supply_chain") continue;
    const w = supplyWeights.get(s.id)!;
    if (supplyRiskIds.has(s.id) && w > 0) supplyWeights.set(s.id, w * scaleSupP);
    else if (supplyLocalIds.has(s.id) && w < 0) supplyWeights.set(s.id, w * scaleSupN);
  }

  const domainW = scaleCategoryWeights(signals, "domain", null, null);
  const bizW = scaleCategoryWeights(signals, "business_identity", null, null);
  const webW = scaleCategoryWeights(signals, "website_quality", null, null);
  const aiW = scaleCategoryWeights(signals, "ai", null, null);

  const allWeights = new Map<string, number>();
  for (const s of signals) {
    let w = 0;
    if (s.category === "reviews") w = reviewW.get(s.id) ?? 0;
    else if (s.category === "supply_chain") w = supplyWeights.get(s.id) ?? 0;
    else if (s.category === "domain") w = domainW.get(s.id) ?? 0;
    else if (s.category === "business_identity") w = bizW.get(s.id) ?? 0;
    else if (s.category === "website_quality") w = webW.get(s.id) ?? 0;
    else if (s.category === "ai") w = aiW.get(s.id) ?? 0;
    allWeights.set(s.id, w);
  }

  let total = BASE_SCORE;
  for (const s of signals) {
    total += allWeights.get(s.id) ?? 0;
  }

  let otherPositive = 0;
  for (const s of signals) {
    const w = allWeights.get(s.id) ?? 0;
    if (w <= 0) continue;
    if (s.category === "domain") continue;
    otherPositive += w;
  }

  if (otherPositive < 1e-6) {
    total = Math.min(DOMAIN_ONLY_SCORE_CAP, total);
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(total)));
  const verdict = verdictFromScore(finalScore);

  const ranked = [...signals].sort(
    (a, b) => Math.abs(allWeights.get(b.id) ?? 0) - Math.abs(allWeights.get(a.id) ?? 0)
  );
  const topPositive = ranked
    .filter((s) => (allWeights.get(s.id) ?? 0) > 0)
    .slice(0, 3)
    .map((s) => ({ ...s }));
  const topNegative = ranked
    .filter((s) => (allWeights.get(s.id) ?? 0) < 0)
    .slice(0, 3)
    .map((s) => ({ ...s }));

  return {
    baseScore: BASE_SCORE,
    finalScore,
    verdict,
    signals,
    topPositiveSignals: topPositive,
    topNegativeSignals: topNegative
  };
}
