import type { ReviewSignals } from "@/lib/reviewSignals";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import type { ProductMarketplaceSignals } from "@/lib/productMarketplaceSignals";
import { verdictFromRiskScore } from "@/lib/trustSystem";
import {
  BRAND_RULES,
  DOMAIN_RISKY_KEYWORDS,
  PHISHING_LURE_WORDS,
  SUSPICIOUS_LEXICAL_PATTERNS,
  TRUST_CEILINGS
} from "@/lib/scoring/heuristics";

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
    | "rebrand_network"
    | "company_identity"
    | "product_marketplace"
    | "ai";
  impact: number;
  confidence: ScoreConfidence;
  reason: string;
  source?: string;
}

export interface ScoreResult {
  baseScore: number;
  finalScore: number;
  verdict: "safe" | "suspicious" | "scam";
  confidence: ScoreConfidence;
  riskLabels: string[];
  signalSources: string[];
  relatedDomains: string[];
  rebrandNetworkSignals: {
    confidence: ScoreConfidence;
    matchedSignals: string[];
    sharedContentMatches: string[];
    sharedInfrastructureMatches: string[];
    sharedIdentityMatches: string[];
  };
  companyIdentitySignals: {
    confidence: ScoreConfidence;
    companyName?: string;
    legalEntityName?: string;
    claimedLocation?: string;
    legalAddress?: string;
    returnAddress?: string;
    supportEmail?: string;
    phoneNumber?: string;
    registrationNumbers: string[];
    mismatches: string[];
    positiveSignals: string[];
    riskSignals: string[];
  };
  productMarketplaceSignals: ProductMarketplaceSignals;
  scoreBreakdown: {
    technicalSafety: {
      score: number;
      label: string;
      explanation: string;
      positiveSignals: string[];
      negativeSignals: string[];
    };
    merchantTrust: {
      score: number;
      label: string;
      explanation: string;
      positiveSignals: string[];
      negativeSignals: string[];
    };
    companyIdentity: {
      score: number;
      label: string;
      explanation: string;
      positiveSignals: string[];
      negativeSignals: string[];
    };
    policyRisk: {
      score: number;
      label: string;
      explanation: string;
      positiveSignals: string[];
      negativeSignals: string[];
    };
    reputationReviews: {
      score: number;
      label: string;
      explanation: string;
      positiveSignals: string[];
      negativeSignals: string[];
    };
  };
  scoreCapsApplied: Array<{
    cap: number;
    reason: string;
  }>;
  userExplanation: {
    summary: string;
    mainReasons: string[];
    positiveNotes: string[];
    cautionNotes: string[];
    recommendation: string;
  };
  riskLabelDetails: Array<{
    label: string;
    explanation: string;
  }>;
  unavailableChecks: string[];
  outscraperReputation?: {
    source: "Outscraper Google Reviews";
    available: boolean;
    rating: number | null;
    reviewCount: number | null;
    negativeReviewRatio: number | null;
    strongestComplaintThemes: string[];
    confidence: ScoreConfidence;
    negativeTrend: boolean;
    suspiciousPositivePattern: boolean;
    businessIdentityMismatch: boolean;
  };
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

const EMPTY_PRODUCT_MARKETPLACE_SIGNALS: ProductMarketplaceSignals = {
  confidence: "low",
  matchedMarketplaces: [],
  matchedImageCount: 0,
  matchedProducts: [],
  riskSignals: [],
  warnings: []
};

const CONF_MULT: Record<ScoreConfidence, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1.0
};

// Keep neutral baseline low enough that reputable low-risk domains (e.g. apple.com)
// do not accidentally land in Caution when major risk signals are absent.
const BASE_SCORE = 22;
const REVIEW_MAX_DOWN = 12;
const REVIEW_MAX_UP = 40;
const SUPPLY_MAX_UP = 40;
const LOCAL_MAX_DOWN = 12;
const REBRAND_NETWORK_MAX_UP = 24;
const COMPANY_IDENTITY_MAX_UP = 24;
const COMPANY_IDENTITY_MAX_DOWN = 10;
const PRODUCT_MARKETPLACE_MAX_UP = 26;
const DOMAIN_ONLY_SCORE_CAP = 70;

const SUBSCORE_WEIGHTS = {
  merchantTrust: 0.37,
  companyIdentity: 0.25,
  reputationReviews: 0.2,
  policyRisk: 0.1,
  technicalSafety: 0.08
} as const;

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
  return verdictFromRiskScore(score);
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
  const matched = DOMAIN_RISKY_KEYWORDS.filter((w) => d.includes(w));
  if (matched.length > 0) {
    out.push({
      id: "domain-sales-keywords",
      label: "Suspicious lexical keywords in domain",
      category: "domain",
      impact: matched.length >= 2 ? 22 : 15,
      confidence: matched.length >= 2 ? "high" : "medium",
      reason: `Domain contains lexical phishing/bait keywords: ${matched.join(", ")}.`
    });
  }
  if (SUSPICIOUS_LEXICAL_PATTERNS.some((re) => re.test(d))) {
    out.push({
      id: "domain-phishing-lexical-pattern",
      label: "Phishing-style lexical pattern",
      category: "domain",
      impact: 36,
      confidence: "high",
      reason:
        "Domain structure and wording match common phishing/credential-harvest naming patterns."
    });
  }

  for (const rule of BRAND_RULES) {
    if (!d.includes(rule.brand)) continue;
    const isOfficial = rule.officialDomains.some((host) => d === host || d.endsWith(`.${host}`));
    if (isOfficial) continue;
    const hasLure = PHISHING_LURE_WORDS.some((w) => d.includes(w));
    out.push({
      id: hasLure ? "domain-brand-impersonation-lure" : "domain-brand-impersonation",
      label: hasLure ? "Brand impersonation with auth/security lure terms" : "Possible brand impersonation",
      category: "domain",
      impact: hasLure ? 42 : 28,
      confidence: "high",
      reason: hasLure
        ? `Domain includes brand term "${rule.brand}" plus deceptive auth/security wording on a non-official domain.`
        : `Domain includes brand term "${rule.brand}" on a non-official domain.`
    });
    break;
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
      impact: -2,
      confidence: "medium",
      reason: "The domain does not contain common bait-style sales keywords."
    });
  }
  if (d.length > 0 && d.length <= 20 && !skipBaitAndLength) {
    out.push({
      id: "domain-normal-length",
      label: "Normal domain length",
      category: "domain",
      impact: -2,
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
        impact: -10,
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
        impact: -8,
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
        impact: -5,
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
        impact: 24,
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
        impact: 14,
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
        impact: -10,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews indicates a very well-established presence.`
      });
    } else if (r >= 4.3 && c >= 100) {
      out.push({
        id: "reviews-trustpilot-strong-positive",
        label: "Strong Trustpilot rating volume",
        category: "reviews",
        impact: -8,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews suggests established reputation.`
      });
    } else if (r >= 4.0 && c >= 25) {
      out.push({
        id: "reviews-trustpilot-moderate-positive",
        label: "Moderate Trustpilot rating volume",
        category: "reviews",
        impact: -5,
        confidence: "medium",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is mildly reassuring.`
      });
    } else if (r <= 2.5 && c >= 10) {
      out.push({
        id: "reviews-trustpilot-poor",
        label: "Poor Trustpilot reviews",
        category: "reviews",
        impact: 24,
        confidence: "high",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is a strong warning signal.`
      });
    } else if (r <= 3.2 && c >= 25) {
      out.push({
        id: "reviews-trustpilot-weak",
        label: "Weak Trustpilot reviews",
        category: "reviews",
        impact: 14,
        confidence: "medium",
        reason: `Trustpilot rating ${r.toFixed(1)} with ${c} reviews is below typical trust levels.`
      });
    }
  };

  addGoogle();
  addTrustpilot();

  const reviewText = review.suspiciousReviewSignals.join(" ").toLowerCase();
  const keywordRisk = (id: string, label: string, re: RegExp, impact: number, reason: string) => {
    if (!re.test(reviewText)) return;
    out.push({
      id,
      label,
      category: "reviews",
      impact,
      confidence: "high",
      reason,
      source: "Public review signal extraction"
    });
  };

  keywordRisk(
    "reviews-complaint-dropship",
    "Dropshipping complaints in review chatter",
    /\bdropship|dropshipping|aliexpress|temu|shein\b/i,
    12,
    "Public review chatter includes dropshipping or marketplace-sourcing complaints."
  );
  keywordRisk(
    "reviews-complaint-refund-returns",
    "Refund / returns friction complaints",
    /\bno refund|refund denied|return to china|china returns|return shipping\b/i,
    14,
    "Review text indicates difficult refunds or expensive cross-border returns."
  );
  keywordRisk(
    "reviews-complaint-quality",
    "Product quality complaints",
    /\bbad quality|cheap quality|poor quality|not as described|misleading ads?\b/i,
    10,
    "Review text repeatedly flags product-quality or misleading-marketing issues."
  );
  keywordRisk(
    "reviews-complaint-shipping",
    "Shipping delay complaints",
    /\bdelayed shipping|late delivery|never arrived|shipping took\b/i,
    9,
    "Review text includes repeated shipping-delay complaints."
  );
  keywordRisk(
    "reviews-pattern-generic-positive",
    "Suspiciously generic positive-review pattern",
    /\bgeneric 5-star|fake reviews?|review spike|sentiment gap\b/i,
    11,
    "Review metadata suggests unusual positive-review patterns or sudden spikes."
  );
  keywordRisk(
    "reviews-brand-location-complaints",
    "Brand location authenticity complaints",
    /\bfake amsterdam|fake dutch brand|not dutch|not from amsterdam|fake london|fake paris\b/i,
    12,
    "Review complaints question whether branding location matches actual operations."
  );

  const outsc = review.outscraper;
  if (outsc?.available) {
    const confidence: ScoreConfidence = outsc.confidence ?? "low";
    if ((outsc.negativeReviewRatio ?? 0) >= 0.35 && (outsc.reviewCount ?? 0) >= 25) {
      out.push({
        id: "reviews-outscraper-high-complaints",
        label: "High complaint volume (Outscraper)",
        category: "reviews",
        impact: 18,
        confidence,
        reason: `Outscraper profile suggests high negative-review ratio (${Math.round((outsc.negativeReviewRatio ?? 0) * 100)}%).`,
        source: "Outscraper Google Reviews"
      });
    } else if ((outsc.negativeReviewRatio ?? 0) >= 0.2 && (outsc.reviewCount ?? 0) >= 20) {
      out.push({
        id: "reviews-outscraper-moderate-complaints",
        label: "Moderate complaint ratio (Outscraper)",
        category: "reviews",
        impact: 10,
        confidence,
        reason: `Outscraper profile indicates a moderate negative-review ratio (${Math.round((outsc.negativeReviewRatio ?? 0) * 100)}%).`,
        source: "Outscraper Google Reviews"
      });
    }
    if (outsc.negativeTrend) {
      out.push({
        id: "reviews-outscraper-negative-trend",
        label: "Negative review trend (Outscraper)",
        category: "reviews",
        impact: 9,
        confidence,
        reason: "Outscraper indicates recent review recency with negative trend characteristics.",
        source: "Outscraper Google Reviews"
      });
    }
    if (outsc.suspiciousPositivePattern) {
      out.push({
        id: "reviews-outscraper-suspicious-positive-pattern",
        label: "Suspicious positive-review pattern",
        category: "reviews",
        impact: 10,
        confidence,
        reason: "Outscraper indicates potential review-spike or suspicious positive-review pattern.",
        source: "Outscraper Google Reviews"
      });
    }
    if (outsc.businessIdentityMismatch) {
      out.push({
        id: "reviews-outscraper-identity-mismatch",
        label: "Business identity mismatch (Outscraper)",
        category: "company_identity",
        impact: 10,
        confidence,
        reason: "Outscraper business profile name appears mismatched with the checked domain identity.",
        source: "Outscraper Google Reviews"
      });
    }
    if ((outsc.reviewCount ?? 0) >= 150 && (outsc.rating ?? 0) >= 4.3 && !outsc.suspiciousPositivePattern && (outsc.negativeReviewRatio ?? 0) < 0.12) {
      out.push({
        id: "reviews-outscraper-strong-positive",
        label: "Strong Outscraper review profile",
        category: "reviews",
        impact: -6,
        confidence,
        reason: "Outscraper shows high review volume with strong average rating and low inferred complaint ratio.",
        source: "Outscraper Google Reviews"
      });
    }
  }
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

function pushEcommerceRiskSignals(websiteText: string, domain: string, out: ScoreSignal[]): void {
  const text = websiteText.toLowerCase();
  if (!text.trim()) return;

  const has = (re: RegExp) => re.test(text);
  const root = domain.split(".")[0]?.toLowerCase() ?? domain.toLowerCase();

  const containsLocationBranding = has(/\b(amsterdam|dutch|netherlands|london|paris)\b/);
  const containsOverseasFulfillment = has(
    /\b(china|asia warehouse|ships from china|international warehouse|customs duties|import taxes)\b/
  );
  if (containsLocationBranding && containsOverseasFulfillment) {
    out.push({
      id: "ecom-brand-location-mismatch",
      label: "Brand location mismatch",
      category: "business_identity",
      impact: 14,
      confidence: "high",
      reason: "Brand positioning and fulfillment language suggest different operating locations.",
      source: "Website policy/content analysis"
    });
  }

  if (has(/\b(return to china|returns address.*china|customer pays return shipping|return shipping.*customer)\b/)) {
    out.push({
      id: "ecom-return-policy-risk",
      label: "Return policy risk",
      category: "business_identity",
      impact: 16,
      confidence: "high",
      reason: "Policy wording indicates costly customer-paid returns or overseas return routing.",
      source: "Website policy/content analysis"
    });
  }

  if (has(/\b(no refunds?|refunds? only store credit|final sale no return|strict refund policy)\b/)) {
    out.push({
      id: "ecom-refund-friction",
      label: "Strict refund conditions",
      category: "business_identity",
      impact: 12,
      confidence: "medium",
      reason: "Refund conditions appear unusually restrictive.",
      source: "Website policy/content analysis"
    });
  }

  if (has(/\b(7-21 business days|10-20 business days|15-30 days|customs duties|import taxes)\b/)) {
    out.push({
      id: "ecom-fulfillment-friction",
      label: "Long cross-border fulfillment pattern",
      category: "supply_chain",
      impact: 12,
      confidence: "high",
      reason: "Shipping timelines and customs language suggest long cross-border fulfillment.",
      source: "Website policy/content analysis"
    });
  }

  if (has(/\b(80% off|90% off|clearance sale|closing down sale)\b/)) {
    out.push({
      id: "ecom-unrealistic-discounts",
      label: "Unrealistic discount pattern",
      category: "website_quality",
      impact: 8,
      confidence: "medium",
      reason: "Very high discount claims are common in short-lived storefronts.",
      source: "Website policy/content analysis"
    });
  }

  if (has(/\b(previously|formerly known as|old name|new name)\b/) || has(/\b(rebrand|rebranding)\b/)) {
    out.push({
      id: "ecom-possible-rebrand",
      label: "Possible rebrand signals",
      category: "business_identity",
      impact: 12,
      confidence: "medium",
      reason: "Text includes wording often associated with renaming or brand transitions.",
      source: "Website policy/content analysis"
    });
  }

  const otherDomains = Array.from(
    new Set(
      (text.match(/\b[a-z0-9-]+\.(?:com|nl|co|io|shop)\b/g) ?? []).filter((d) => !d.includes(root))
    )
  );
  if (otherDomains.length >= 2) {
    out.push({
      id: "ecom-multi-domain-footprint",
      label: "Multiple related domains mentioned",
      category: "business_identity",
      impact: 10,
      confidence: "medium",
      reason: "Site text references multiple domains, which can indicate a multi-brand or rebrand footprint.",
      source: "Website policy/content analysis"
    });
  }
}

type RebrandNetworkDetection = {
  relatedDomains: string[];
  matchedSignals: string[];
  sharedContentMatches: string[];
  sharedInfrastructureMatches: string[];
  sharedIdentityMatches: string[];
  confidence: ScoreConfidence;
};

function extractRelatedDomains(websiteText: string, currentDomain: string): string[] {
  const selfRoot = currentDomain.toLowerCase().replace(/^www\./, "");
  const matches = websiteText.toLowerCase().match(/\b[a-z0-9-]+\.(?:com|nl|co|io|shop|store|eu|de|fr|uk)\b/g) ?? [];
  const out = new Set<string>();
  for (const d of matches) {
    const norm = d.replace(/^www\./, "");
    if (norm === selfRoot) continue;
    if (selfRoot.includes(norm) || norm.includes(selfRoot)) continue;
    out.add(norm);
  }
  return [...out].slice(0, 12);
}

function detectRebrandNetworkSignals(websiteText: string, domain: string): RebrandNetworkDetection {
  const t = websiteText.toLowerCase();
  const relatedDomains = extractRelatedDomains(websiteText, domain);
  const sharedContentMatches: string[] = [];
  const sharedInfrastructureMatches: string[] = [];
  const sharedIdentityMatches: string[] = [];

  const has = (re: RegExp) => re.test(t);

  // Shared infrastructure (guardrail: generic platform mentions are weak unless paired with IDs/widgets)
  if (has(/\b(shopify theme|shopifycdn|cdn\.shopify)\b/)) sharedInfrastructureMatches.push("Shopify infrastructure markers");
  if (has(/\b(woocommerce|wp-content\/plugins\/woocommerce)\b/)) sharedInfrastructureMatches.push("WooCommerce infrastructure markers");
  if (has(/\b(meta pixel|facebook pixel|fbq\(|gtm-|google tag manager|ga4|g-\w{6,}|ua-\d{4,})\b/)) {
    sharedInfrastructureMatches.push("Shared analytics/pixel instrumentation hints");
  }
  if (has(/\b(yotpo|judge\.me|loox|trustpilot widget)\b/)) sharedInfrastructureMatches.push("Shared review widget stack");
  if (has(/\b(cookiebot|onetrust|cookieyes)\b/)) sharedInfrastructureMatches.push("Shared cookie/banner tooling");
  if (has(/\b(intercom|zendesk|tidio|crisp\.chat|tawk\.to)\b/)) sharedInfrastructureMatches.push("Shared support/chat widget stack");

  // Shared content
  if (has(/\b(same (shipping|returns|refund) policy|policy applies to our partner stores|across our brands)\b/)) {
    sharedContentMatches.push("Shared policy text detected");
  }
  if (has(/\b(about us|our story)\b.*\b(family business|started in)\b/)) {
    sharedContentMatches.push("Reused about-us narrative structure");
  }
  if (has(/\b(faq|frequently asked questions)\b.*\b(track my order|where is my order)\b/)) {
    sharedContentMatches.push("FAQ wording overlap hints");
  }
  if (has(/\b(return to china|china warehouse|customer pays return shipping)\b/)) {
    sharedContentMatches.push("Shared shipping/return friction wording");
  }

  // Identity / relationship
  if (has(/\b(formerly|previously known as|old domain|old brand|rebrand|renamed)\b/)) {
    sharedIdentityMatches.push("Previous brand/domain indicators");
  }
  if (relatedDomains.length > 0) {
    sharedIdentityMatches.push("Related stores detected");
  }
  if (has(/\b(vat|kvk|kamer van koophandel|registered company|company number)\b/)) {
    sharedIdentityMatches.push("Legal-entity linkage hints");
  }
  if (has(/\b(support@|help@|returns@)\S+\.\w+\b/)) {
    sharedIdentityMatches.push("Support email identity linkage");
  }
  if (has(/\b(return address|warehouse address|fulfillment center)\b/)) {
    sharedIdentityMatches.push("Shared return/warehouse identity hints");
  }
  if (has(/\b(instagram\.com\/|tiktok\.com\/@|facebook\.com\/)\S+/)) {
    sharedIdentityMatches.push("Shared social-handle linkage hints");
  }

  const independentBuckets =
    Number(sharedContentMatches.length > 0) +
    Number(sharedInfrastructureMatches.length > 0) +
    Number(sharedIdentityMatches.length > 0);

  const matchedSignals = [
    ...sharedContentMatches,
    ...sharedInfrastructureMatches,
    ...sharedIdentityMatches
  ];

  const confidence: ScoreConfidence =
    independentBuckets >= 3 && matchedSignals.length >= 4
      ? "high"
      : independentBuckets >= 2 && matchedSignals.length >= 2
        ? "medium"
        : matchedSignals.length > 0
          ? "low"
          : "low";

  return {
    relatedDomains,
    matchedSignals,
    sharedContentMatches,
    sharedInfrastructureMatches,
    sharedIdentityMatches,
    confidence
  };
}

function pushRebrandNetworkSignals(
  detection: RebrandNetworkDetection,
  out: ScoreSignal[],
  context: {
    hasBadReviews: boolean;
    hasDropshipSignals: boolean;
    hasReturnChinaSignals: boolean;
    hasHiddenOwnershipSignals: boolean;
    hasRecentDomainSignals: boolean;
    hasBrandMismatchSignals: boolean;
  }
): void {
  const independentBuckets =
    Number(detection.sharedContentMatches.length > 0) +
    Number(detection.sharedInfrastructureMatches.length > 0) +
    Number(detection.sharedIdentityMatches.length > 0);
  const overlapRiskCount = Object.values(context).filter(Boolean).length;

  // Guardrail: single weak similarity should not produce a major penalty.
  if (independentBuckets < 2 || detection.matchedSignals.length < 2) {
    if (detection.matchedSignals.length > 0) {
      out.push({
        id: "rebrand-network-weak-hint",
        label: "Weak rebrand-network hint",
        category: "rebrand_network",
        impact: 2,
        confidence: "low",
        reason: "A small number of similarities were found, but not enough independent overlap for a strong network claim.",
        source: "Rebrand network mapping"
      });
    }
    return;
  }

  const baseImpact = independentBuckets >= 3 ? 14 : 8;
  const overlapBoost = Math.min(10, overlapRiskCount * 2);
  const impact = baseImpact + overlapBoost;
  out.push({
    id: "rebrand-network-overlap",
    label: "Possible rebrand network overlap",
    category: "rebrand_network",
    impact,
    confidence: detection.confidence,
    reason:
      "Multiple independent shared signals (content/infrastructure/identity) were detected across related domains and overlap with other risk indicators.",
    source: "Rebrand network mapping"
  });
}

type CompanyIdentityDetection = {
  confidence: ScoreConfidence;
  companyName?: string;
  legalEntityName?: string;
  claimedLocation?: string;
  legalAddress?: string;
  returnAddress?: string;
  supportEmail?: string;
  phoneNumber?: string;
  registrationNumbers: string[];
  mismatches: string[];
  positiveSignals: string[];
  riskSignals: string[];
};

function firstMatch(text: string, re: RegExp): string | undefined {
  const m = text.match(re);
  return m?.[1]?.trim();
}

function detectClaimedLocation(text: string): string | undefined {
  return (
    firstMatch(text, /\b(?:based in|from|located in|proudly from)\s+([A-Za-z][A-Za-z\s,-]{2,60})/i) ??
    firstMatch(text, /\b(amsterdam|netherlands|dutch|london|paris|berlin|europe)\b/i)
  );
}

function isValidDutchKvk(raw: string): boolean {
  return /^\d{8}$/.test(raw);
}

function isValidEuVat(raw: string): boolean {
  const v = raw.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(v);
}

function countryFromAddress(addr?: string): string | undefined {
  if (!addr) return undefined;
  const a = addr.toLowerCase();
  if (/\bnetherlands|nederland|amsterdam|rotterdam|utrecht\b/.test(a)) return "NL";
  if (/\bchina|shenzhen|guangzhou|hong kong\b/.test(a)) return "CN";
  if (/\buk|united kingdom|london\b/.test(a)) return "UK";
  if (/\bfrance|paris\b/.test(a)) return "FR";
  if (/\bgermany|berlin\b/.test(a)) return "DE";
  return undefined;
}

function isFreeMailProvider(email?: string): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com"].includes(domain);
}

function detectCompanyIdentitySignals(websiteText: string, domain: string): CompanyIdentityDetection {
  const t = websiteText;
  const lower = t.toLowerCase();
  const registrationNumbers: string[] = [];
  const mismatches: string[] = [];
  const positiveSignals: string[] = [];
  const riskSignals: string[] = [];

  const supportEmail = firstMatch(t, /\b(?:support|help|contact|returns?)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i)
    ? `support@${firstMatch(t, /\b(?:support|help|contact|returns?)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i)}`
    : firstMatch(t, /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/i);
  const phoneNumber = firstMatch(t, /\b(\+?\d[\d\s().-]{6,}\d)\b/);
  const claimedLocation = detectClaimedLocation(t);
  const legalAddress = firstMatch(t, /\b(?:registered address|company address|legal address)\s*[:.-]?\s*([^\n]{8,160})/i);
  const returnAddress = firstMatch(t, /\b(?:return address|returns address|warehouse address)\s*[:.-]?\s*([^\n]{8,160})/i);
  const companyName =
    firstMatch(t, /\b(?:company name|trading as)\s*[:.-]?\s*([^.\n]{3,80})/i) ??
    firstMatch(t, /©\s*\d{4}\s*([A-Za-z0-9&.,'\-\s]{3,80})/i);
  const legalEntityName = firstMatch(
    t,
    /\b(?:legal entity|registered as|operated by|owned by)\s*[:.-]?\s*([^.\n]{3,100})/i
  );

  const kvkLabelPresent = /\b(?:kvk|kamer van koophandel)\b/i.test(t);
  const vatLabelPresent = /\b(?:vat|btw|uid)\b/i.test(t);
  const kvk = firstMatch(t, /\b(?:kvk|kamer van koophandel)\s*[:#]?\s*(\d{6,12})\b/i);
  if (kvk) registrationNumbers.push(kvk);
  const vat = firstMatch(t, /\b(?:vat|btw|uid)\s*[:#]?\s*([A-Za-z]{2}[A-Za-z0-9\s.-]{8,16})\b/i)?.replace(/\s+/g, "");
  if (vat) registrationNumbers.push(vat);

  const siteHost = domain.toLowerCase().replace(/^www\./, "");
  const emailDomain = supportEmail?.split("@")[1]?.toLowerCase().replace(/^www\./, "");
  if (supportEmail) {
    if (emailDomain && (siteHost === emailDomain || siteHost.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${siteHost}`))) {
      positiveSignals.push("Support email domain matches website domain");
    } else {
      mismatches.push("Support email domain mismatch");
      riskSignals.push("Support email domain differs from store domain");
    }
    if (isFreeMailProvider(supportEmail)) {
      riskSignals.push("Free email provider used");
    }
  }

  if (kvk) {
    if (isValidDutchKvk(kvk)) positiveSignals.push("KVK format looks valid");
    else {
      mismatches.push("KVK format mismatch");
      riskSignals.push("Registration format issue");
    }
  }
  if (kvkLabelPresent && !kvk) {
    mismatches.push("KVK present but number missing or malformed");
    riskSignals.push("Registration format issue");
  }
  if (vat) {
    if (isValidEuVat(vat)) positiveSignals.push("VAT format looks valid");
    else {
      mismatches.push("VAT format mismatch");
      riskSignals.push("Registration format issue");
    }
  }
  if (vatLabelPresent && !vat) {
    mismatches.push("VAT present but number missing or malformed");
    riskSignals.push("Registration format issue");
  }

  if (claimedLocation && /amsterdam|dutch|netherlands/i.test(claimedLocation) && !kvk && !vat && !legalAddress) {
    mismatches.push("Dutch brand claim lacks legal Dutch identity details");
    riskSignals.push("Brand location mismatch");
    riskSignals.push("Missing company identity");
  }

  const legalCountry = countryFromAddress(legalAddress);
  const returnCountry = countryFromAddress(returnAddress);
  const claimedCountry = countryFromAddress(claimedLocation);
  if (claimedCountry && legalCountry && claimedCountry !== legalCountry) {
    mismatches.push("Claimed brand location conflicts with legal location");
    riskSignals.push("Brand location mismatch");
  }
  if (claimedCountry && returnCountry && claimedCountry !== returnCountry) {
    mismatches.push("Claimed brand location conflicts with return location");
    riskSignals.push("Brand location mismatch");
  }
  if (legalCountry && returnCountry && legalCountry !== returnCountry) {
    mismatches.push("Legal location conflicts with return address country");
    riskSignals.push("Return address mismatch");
  }
  if (!legalEntityName && !companyName && lower.length > 300) {
    riskSignals.push("Missing company identity");
  }
  if (companyName && legalEntityName && companyName.toLowerCase() !== legalEntityName.toLowerCase()) {
    riskSignals.push("Inconsistent legal entity");
    mismatches.push("Different company names detected across pages");
  }

  if (legalAddress) positiveSignals.push("Legal address detected");
  if (returnAddress) positiveSignals.push("Return address detected");
  if (phoneNumber) positiveSignals.push("Phone number detected");
  if (legalEntityName || companyName) positiveSignals.push("Company identity detected");

  const weightedSignals = positiveSignals.length + riskSignals.length;
  const confidence: ScoreConfidence =
    weightedSignals >= 5 ? "high" : weightedSignals >= 3 ? "medium" : "low";

  const dedup = (arr: string[]) => [...new Set(arr)];
  return {
    confidence,
    companyName,
    legalEntityName,
    claimedLocation,
    legalAddress,
    returnAddress,
    supportEmail,
    phoneNumber,
    registrationNumbers: dedup(registrationNumbers),
    mismatches: dedup(mismatches),
    positiveSignals: dedup(positiveSignals),
    riskSignals: dedup(riskSignals)
  };
}

function pushCompanyIdentitySignals(
  detection: CompanyIdentityDetection,
  out: ScoreSignal[],
  context: {
    hasBadReviews: boolean;
    hasRebrandSignals: boolean;
    hasDropshippingSignals: boolean;
    hasRecentDomainSignals: boolean;
  }
): void {
  const riskCount = detection.riskSignals.length;
  const positiveCount = detection.positiveSignals.length;
  const overlap = Object.values(context).filter(Boolean).length;

  if (riskCount >= 2) {
    const base = riskCount >= 4 ? 16 : 10;
    const overlapBoost = Math.min(8, overlap * 2);
    out.push({
      id: "company-identity-risk",
      label: "Company identity inconsistencies",
      category: "company_identity",
      impact: base + overlapBoost,
      confidence: detection.confidence,
      reason:
        "Multiple identity inconsistencies were detected across legal/contact/return/location signals.",
      source: "Company identity verification"
    });
  } else if (riskCount === 1) {
    // Guardrail: single issue should be mild.
    out.push({
      id: "company-identity-minor-risk",
      label: "Minor company identity issue",
      category: "company_identity",
      impact: 4,
      confidence: "low",
      reason: "A single company identity inconsistency was detected; treated as a weak warning.",
      source: "Company identity verification"
    });
  }

  if (positiveCount >= 3 && riskCount === 0) {
    out.push({
      id: "company-identity-consistent",
      label: "Consistent legal/contact identity signals",
      category: "company_identity",
      impact: -8,
      confidence: detection.confidence,
      reason: "Company identity fields are present and internally consistent.",
      source: "Company identity verification"
    });
  } else if (positiveCount >= 2 && riskCount <= 1) {
    out.push({
      id: "company-identity-partial-positive",
      label: "Partially consistent company identity",
      category: "company_identity",
      impact: -3,
      confidence: "medium",
      reason: "Some company identity details are present and consistent.",
      source: "Company identity verification"
    });
  }
}

function pushProductMarketplaceSignals(
  detection: ProductMarketplaceSignals,
  out: ScoreSignal[],
  context: {
    hasDropshippingSignals: boolean;
    hasRebrandSignals: boolean;
    hasBadReviews: boolean;
    hasBrandMismatchSignals: boolean;
    hasWeakIdentitySignals: boolean;
  }
): void {
  const strongMatches = detection.matchedProducts.filter((m) => m.similarityScore >= 0.85).length;
  const overlapCount = Object.values(context).filter(Boolean).length;

  if (detection.matchedImageCount <= 0) return;
  if (detection.matchedImageCount === 1 && strongMatches === 0) {
    out.push({
      id: "product-marketplace-weak-match",
      label: "Weak marketplace image overlap",
      category: "product_marketplace",
      impact: 2,
      confidence: "low",
      reason: "One weak marketplace-style image overlap was found; treated as contextual only.",
      source: "Product marketplace image matching"
    });
    return;
  }

  const baseImpact = strongMatches >= 3 || detection.matchedImageCount >= 4 ? 14 : detection.matchedImageCount >= 2 ? 8 : 4;
  const overlapBoost = Math.min(10, overlapCount * 2);
  out.push({
    id: "product-marketplace-overlap",
    label: "Supplier marketplace product-image overlap",
    category: "product_marketplace",
    impact: baseImpact + overlapBoost,
    confidence: detection.confidence,
    reason:
      "Multiple product images appear highly similar to large marketplace/supplier listings; this increases risk mainly when it overlaps with other indicators.",
    source: "Product marketplace image matching"
  });

  if (context.hasBrandMismatchSignals && detection.matchedImageCount >= 2) {
    out.push({
      id: "product-marketplace-brand-conflict",
      label: "Brand positioning vs supplier-image conflict",
      category: "product_marketplace",
      impact: 8,
      confidence: detection.confidence === "low" ? "medium" : detection.confidence,
      reason: "Local/luxury brand positioning conflicts with supplier-marketplace image overlap.",
      source: "Product marketplace image matching"
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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function labelForTrustScore(score: number): string {
  if (score >= 85) return "Trusted";
  if (score >= 65) return "Likely Safe";
  if (score >= 45) return "Mixed / Unknown";
  if (score >= 25) return "Suspicious";
  return "Dangerous";
}

function buildSubscoreFromSignals(args: {
  title: string;
  signals: ScoreSignal[];
  allWeights: Map<string, number>;
  explanation: string;
}) {
  const pos = args.signals.filter((s) => (args.allWeights.get(s.id) ?? 0) < 0);
  const neg = args.signals.filter((s) => (args.allWeights.get(s.id) ?? 0) > 0);
  const netRisk = args.signals.reduce((acc, s) => acc + (args.allWeights.get(s.id) ?? 0), 0);
  const trustScore = Math.round(clamp(82 - netRisk, 0, 100));
  return {
    score: trustScore,
    label: labelForTrustScore(trustScore),
    explanation: args.explanation,
    positiveSignals: pos.slice(0, 4).map((s) => s.reason),
    negativeSignals: neg.slice(0, 4).map((s) => s.reason)
  };
}

export function calculateScamScore(input: {
  domain: string;
  heuristicReasons: string[];
  reviewSignals?: ReviewSignals;
  supplyChainSignals?: SupplyChainSignals;
  addressSignals?: AddressSignalsInput;
  domainAgeSignals?: DomainAgeSignalsInput;
  aiRiskSignals?: AiRiskSignalsInput;
  productMarketplaceSignals?: ProductMarketplaceSignals | null;
  externalSignals?: ScoreSignal[];
  /** Snippet used only for business-identity heuristics when addressSignals omit fields. */
  websiteText?: string;
}): ScoreResult {
  void input.heuristicReasons;

  const signals: ScoreSignal[] = [];
  const domain = input.domain.toLowerCase();
  const reviewTier = computeReviewTierFlags(input.reviewSignals);
  const rebrandDetection = detectRebrandNetworkSignals(input.websiteText ?? "", domain);
  const companyIdentityDetection = detectCompanyIdentitySignals(input.websiteText ?? "", domain);
  const productMarketplaceDetection = input.productMarketplaceSignals ?? EMPTY_PRODUCT_MARKETPLACE_SIGNALS;

  pushDomainSignals(domain, signals);
  if (input.reviewSignals) pushReviewSignals(input.reviewSignals, signals);
  if (input.supplyChainSignals) {
    const allowSupplyRisk = input.supplyChainSignals.scoreAdjustment > 0;
    pushSupplyChainSignals(input.supplyChainSignals, signals, allowSupplyRisk);
  }

  const inferredAddr = inferAddressSignals(input.websiteText ?? "");
  const addr: AddressSignalsInput = { ...inferredAddr, ...input.addressSignals };
  pushBusinessIdentitySignals(addr, input.websiteText ?? "", signals);
  pushEcommerceRiskSignals(input.websiteText ?? "", domain, signals);
  pushDomainAgeSignals(input.domainAgeSignals, signals);
  pushDomainTrustSignals(domain, signals, reviewTier);
  pushAiRiskSignals(input.aiRiskSignals?.level, signals, reviewTier);
  if (input.externalSignals?.length) {
    signals.push(...input.externalSignals);
  }
  const hasSignalNow = (id: string) => signals.some((s) => s.id === id);
  pushRebrandNetworkSignals(rebrandDetection, signals, {
    hasBadReviews: hasSignalNow("reviews-google-poor") || hasSignalNow("reviews-trustpilot-poor") || hasSignalNow("reviews-complaint-quality"),
    hasDropshipSignals: hasSignalNow("supply-dropshipping") || hasSignalNow("reviews-complaint-dropship"),
    hasReturnChinaSignals: hasSignalNow("ecom-return-policy-risk") || hasSignalNow("reviews-complaint-refund-returns"),
    hasHiddenOwnershipSignals: hasSignalNow("intel-hidden-ownership") || hasSignalNow("biz-no-address"),
    hasRecentDomainSignals: hasSignalNow("domain-age-very-new") || hasSignalNow("intel-domain-very-new") || hasSignalNow("intel-domain-young"),
    hasBrandMismatchSignals: hasSignalNow("ecom-brand-location-mismatch")
  });
  pushCompanyIdentitySignals(companyIdentityDetection, signals, {
    hasBadReviews: hasSignalNow("reviews-google-poor") || hasSignalNow("reviews-trustpilot-poor"),
    hasRebrandSignals: hasSignalNow("rebrand-network-overlap") || hasSignalNow("ecom-possible-rebrand"),
    hasDropshippingSignals: hasSignalNow("supply-dropshipping") || hasSignalNow("reviews-complaint-dropship"),
    hasRecentDomainSignals: hasSignalNow("domain-age-very-new") || hasSignalNow("intel-domain-very-new")
  });
  pushProductMarketplaceSignals(productMarketplaceDetection, signals, {
    hasDropshippingSignals: hasSignalNow("supply-dropshipping") || hasSignalNow("reviews-complaint-dropship"),
    hasRebrandSignals: hasSignalNow("rebrand-network-overlap") || hasSignalNow("ecom-possible-rebrand"),
    hasBadReviews: hasSignalNow("reviews-google-poor") || hasSignalNow("reviews-trustpilot-poor") || hasSignalNow("reviews-outscraper-high-complaints"),
    hasBrandMismatchSignals: hasSignalNow("ecom-brand-location-mismatch"),
    hasWeakIdentitySignals: hasSignalNow("company-identity-risk") || hasSignalNow("biz-no-address")
  });

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
  const rebrandW = scaleCategoryWeights(signals, "rebrand_network", REBRAND_NETWORK_MAX_UP, null);
  const companyW = scaleCategoryWeights(signals, "company_identity", COMPANY_IDENTITY_MAX_UP, COMPANY_IDENTITY_MAX_DOWN);
  const productW = scaleCategoryWeights(signals, "product_marketplace", PRODUCT_MARKETPLACE_MAX_UP, null);
  const aiW = scaleCategoryWeights(signals, "ai", null, null);

  const allWeights = new Map<string, number>();
  for (const s of signals) {
    let w = 0;
    if (s.category === "reviews") w = reviewW.get(s.id) ?? 0;
    else if (s.category === "supply_chain") w = supplyWeights.get(s.id) ?? 0;
    else if (s.category === "domain") w = domainW.get(s.id) ?? 0;
    else if (s.category === "business_identity") w = bizW.get(s.id) ?? 0;
    else if (s.category === "website_quality") w = webW.get(s.id) ?? 0;
    else if (s.category === "rebrand_network") w = rebrandW.get(s.id) ?? 0;
    else if (s.category === "company_identity") w = companyW.get(s.id) ?? 0;
    else if (s.category === "product_marketplace") w = productW.get(s.id) ?? 0;
    else if (s.category === "ai") w = aiW.get(s.id) ?? 0;
    allWeights.set(s.id, w);
  }

  const technicalSignals = signals.filter((s) => s.category === "website_quality" || s.id.startsWith("intel-"));
  const merchantSignals = signals.filter(
    (s) => s.category === "supply_chain" || s.category === "rebrand_network" || s.category === "product_marketplace"
  );
  const companySignals = signals.filter((s) => s.category === "company_identity" || s.category === "business_identity");
  const policySignals = signals.filter((s) =>
    ["ecom-return-policy-risk", "ecom-refund-friction", "ecom-fulfillment-friction"].includes(s.id)
  );
  const reputationSignals = signals.filter((s) => s.category === "reviews");

  const scoreBreakdown = {
    technicalSafety: buildSubscoreFromSignals({
      title: "Technical safety",
      signals: technicalSignals,
      allWeights,
      explanation:
        "This checks malware/phishing/security indicators. SSL helps, but encryption alone does not prove the store is trustworthy."
    }),
    merchantTrust: buildSubscoreFromSignals({
      title: "Merchant trust",
      signals: merchantSignals,
      allWeights,
      explanation:
        "This reflects merchant behavior patterns such as dropshipping/rebrand overlap and fulfillment risk patterns."
    }),
    companyIdentity: buildSubscoreFromSignals({
      title: "Company identity",
      signals: companySignals,
      allWeights,
      explanation:
        "This checks whether company/legal/contact identity is clear and internally consistent across pages."
    }),
    policyRisk: buildSubscoreFromSignals({
      title: "Policy/refund risk",
      signals: policySignals,
      allWeights,
      explanation:
        "This focuses on returns/refunds/shipping friction that can make customer recovery difficult."
    }),
    reputationReviews: buildSubscoreFromSignals({
      title: "Reputation/reviews",
      signals: reputationSignals,
      allWeights,
      explanation:
        "This reflects external review reputation, complaint patterns, and suspicious review behavior."
    })
  };

  const weightedTrustScore = Math.round(
    scoreBreakdown.merchantTrust.score * SUBSCORE_WEIGHTS.merchantTrust +
      scoreBreakdown.companyIdentity.score * SUBSCORE_WEIGHTS.companyIdentity +
      scoreBreakdown.reputationReviews.score * SUBSCORE_WEIGHTS.reputationReviews +
      scoreBreakdown.policyRisk.score * SUBSCORE_WEIGHTS.policyRisk +
      scoreBreakdown.technicalSafety.score * SUBSCORE_WEIGHTS.technicalSafety
  );
  let finalTrustScore = clamp(weightedTrustScore, 0, 100);
  let finalScore = clamp(100 - finalTrustScore, 0, 100);

  const scoreCapsApplied: Array<{ cap: number; reason: string }> = [];
  const applyCap = (cap: number, reason: string) => {
    if (finalTrustScore > cap) {
      finalTrustScore = cap;
      finalScore = 100 - finalTrustScore;
      scoreCapsApplied.push({ cap, reason });
    }
  };
  const majorRiskSignals = new Set([
    "supply-china-fulfillment",
    "supply-dropshipping",
    "ecom-possible-rebrand",
    "ecom-return-policy-risk",
    "ecom-brand-location-mismatch",
    "rebrand-network-overlap",
    "company-identity-risk",
    "product-marketplace-overlap",
    "product-marketplace-brand-conflict",
    "reviews-complaint-dropship",
    "reviews-complaint-refund-returns"
  ]);
  const hasSignal = (id: string) => signals.some((s) => s.id === id && (allWeights.get(s.id) ?? 0) > 0);
  if (
    (hasSignal("reviews-outscraper-high-complaints") || hasSignal("reviews-google-poor") || hasSignal("reviews-trustpilot-poor")) &&
    (hasSignal("ecom-return-policy-risk") || hasSignal("reviews-complaint-refund-returns"))
  ) {
    applyCap(65, "High complaint volume with refund/return friction capped the trust score.");
  }
  if (hasSignal("reviews-outscraper-high-complaints")) {
    applyCap(60, "Strong Outscraper complaint ratio capped the trust score.");
  }
  if (hasSignal("reviews-complaint-shipping") || hasSignal("reviews-complaint-quality")) {
    applyCap(78, "Repeated customer complaint themes capped the trust score.");
  }
  if (hasSignal("rebrand-network-overlap") && (hasSignal("reviews-outscraper-high-complaints") || hasSignal("reviews-complaint-dropship"))) {
    applyCap(50, "Rebrand-network overlap combined with poor reputation capped the trust score.");
  }
  if (hasSignal("ecom-brand-location-mismatch") && (hasSignal("ecom-return-policy-risk") || hasSignal("company-identity-risk"))) {
    applyCap(55, "Brand location mismatch with conflicting legal/return signals capped the trust score.");
  }
  if (
    companyIdentityDetection.riskSignals.includes("Missing company identity") &&
    (hasSignal("domain-age-very-new") || hasSignal("intel-domain-very-new")) &&
    (hasSignal("reviews-outscraper-high-complaints") || hasSignal("reviews-google-poor") || hasSignal("reviews-trustpilot-poor"))
  ) {
    applyCap(45, "Missing company identity plus young domain and negative reputation capped the trust score.");
  }
  if (hasSignal("intel-safe-browsing-flagged") || hasSignal("intel-openphish-listed") || hasSignal("intel-urlhaus-listed")) {
    applyCap(20, "Malware/phishing intelligence hit capped the trust score.");
  }
  if (hasSignal("intel-no-tls") || hasSignal("intel-tls-issue")) {
    applyCap(TRUST_CEILINGS.failedTls, "Failed or invalid TLS capped trust to avoid false-safe outcomes.");
  }
  if (hasSignal("domain-phishing-lexical-pattern")) {
    applyCap(TRUST_CEILINGS.phishingLexical, "Phishing lexical pattern capped trust score.");
  }
  if (hasSignal("domain-brand-impersonation-lure") || hasSignal("domain-brand-impersonation")) {
    applyCap(TRUST_CEILINGS.brandImpersonation, "Brand impersonation pattern capped trust score.");
  }
  if (
    hasSignal("product-marketplace-overlap") &&
    (hasSignal("supply-dropshipping") || hasSignal("reviews-complaint-dropship") || hasSignal("company-identity-risk"))
  ) {
    applyCap(58, "Marketplace image overlap combined with dropshipping/identity risk capped the trust score.");
  }

  const majorRiskPresent = signals.some((s) => majorRiskSignals.has(s.id) && (allWeights.get(s.id) ?? 0) > 0);
  if (majorRiskPresent) {
    finalScore = Math.max(finalScore, 32);
    finalTrustScore = 100 - finalScore;
  }
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

  const riskLabels: string[] = [];
  if (hasSignal("supply-dropshipping") || hasSignal("reviews-complaint-dropship")) riskLabels.push("Possible dropshipping store");
  if (
    hasSignal("reviews-google-poor") ||
    hasSignal("reviews-trustpilot-poor") ||
    hasSignal("reviews-outscraper-high-complaints") ||
    hasSignal("reviews-complaint-quality") ||
    hasSignal("reviews-complaint-shipping")
  ) {
    riskLabels.push("High complaint volume");
  }
  if (hasSignal("reviews-outscraper-negative-trend")) riskLabels.push("Negative review trend");
  if (
    hasSignal("reviews-complaint-refund-returns") ||
    hasSignal("reviews-complaint-shipping") ||
    hasSignal("reviews-outscraper-moderate-complaints")
  ) {
    riskLabels.push("Refund/shipping complaints");
  }
  if (hasSignal("reviews-outscraper-suspicious-positive-pattern")) riskLabels.push("Suspicious review pattern");
  if (hasSignal("reviews-outscraper-identity-mismatch")) riskLabels.push("Business identity mismatch");
  if (hasSignal("ecom-possible-rebrand") || hasSignal("ecom-multi-domain-footprint")) riskLabels.push("Possible rebrand");
  if (hasSignal("rebrand-network-overlap")) riskLabels.push("Possible rebrand network");
  if (rebrandDetection.relatedDomains.length > 0) riskLabels.push("Related stores detected");
  if (rebrandDetection.sharedContentMatches.length > 0) riskLabels.push("Shared policy text detected");
  if (rebrandDetection.sharedInfrastructureMatches.length > 0) riskLabels.push("Shared tracking or infrastructure detected");
  if (rebrandDetection.sharedIdentityMatches.some((m) => m === "Previous brand/domain indicators")) {
    riskLabels.push("Previous brand/domain indicators");
  }
  if (hasSignal("ecom-return-policy-risk") || hasSignal("ecom-refund-friction")) riskLabels.push("Return policy risk");
  if (hasSignal("ecom-brand-location-mismatch")) riskLabels.push("Brand location mismatch");
  if (companyIdentityDetection.riskSignals.includes("Missing company identity")) riskLabels.push("Missing company identity");
  if (companyIdentityDetection.riskSignals.includes("Inconsistent legal entity")) riskLabels.push("Inconsistent legal entity");
  if (companyIdentityDetection.riskSignals.includes("Registration format issue")) riskLabels.push("Registration format issue");
  if (companyIdentityDetection.riskSignals.includes("Return address mismatch")) riskLabels.push("Return address mismatch");
  if (companyIdentityDetection.riskSignals.includes("Free email provider used")) riskLabels.push("Free email provider used");
  if (hasSignal("product-marketplace-overlap")) riskLabels.push("Possible marketplace reseller");
  if (productMarketplaceDetection.matchedImageCount > 0) riskLabels.push("Supplier product images detected");
  if (productMarketplaceDetection.matchedImageCount >= 2) riskLabels.push("Product images found on external marketplaces");
  if (
    hasSignal("product-marketplace-overlap") &&
    (hasSignal("supply-dropshipping") || hasSignal("reviews-complaint-dropship"))
  ) {
    riskLabels.push("Possible dropshipping products");
  }

  const highConfCount = signals.filter((s) => (allWeights.get(s.id) ?? 0) !== 0 && s.confidence === "high").length;
  const nonZeroCount = signals.filter((s) => (allWeights.get(s.id) ?? 0) !== 0).length;
  const confidence: ScoreConfidence = highConfCount >= 3 ? "high" : nonZeroCount >= 4 ? "medium" : "low";
  if (confidence === "low") {
    applyCap(TRUST_CEILINGS.lowConfidence, "Low-confidence assessments cannot be marked as trusted.");
  }
  const signalSources = Array.from(
    new Set(
      signals
        .map((s) => s.source?.trim())
        .filter((v): v is string => Boolean(v))
    )
  );

  const riskLabelDetails = riskLabels.map((label) => ({
    label,
    explanation:
      label === "Possible dropshipping store"
        ? "Shipping/fulfillment and review signals resemble common dropshipping patterns."
        : label === "High complaint volume"
          ? "A substantial share of customer feedback indicates serious issues."
          : label === "Return policy risk"
            ? "Return/refund terms may make it harder to recover money when something goes wrong."
            : label === "Brand location mismatch"
              ? "The claimed brand location does not fully match legal or fulfillment signals."
              : label === "Missing company identity"
                ? "Limited legal/company details were found, reducing trust certainty."
                : label === "Possible rebrand network"
                  ? "Multiple overlaps suggest this store may be linked to other brand/domain identities."
                  : label === "Suspicious review pattern"
                    ? "Review velocity/patterns look unusual and may not reflect normal organic feedback."
                    : label === "Technical safety issue"
                      ? "Security intelligence checks found technical risk indicators."
                      : label === "Possible marketplace reseller"
                        ? "Product-image overlap with supplier marketplaces suggests possible reseller sourcing."
                        : label === "Supplier product images detected"
                          ? "Some product photos look similar to external marketplace supplier listings."
                          : label === "Product images found on external marketplaces"
                            ? "Multiple product images appear on large marketplaces; this is contextual evidence, not proof."
                            : label === "Possible dropshipping products"
                              ? "Marketplace image overlap and dropshipping signals together increase risk."
                      : "This label indicates a meaningful risk pattern in the current scan."
  }));

  const cautionNotes = [
    ...scoreBreakdown.reputationReviews.negativeSignals.slice(0, 2),
    ...scoreBreakdown.companyIdentity.negativeSignals.slice(0, 2),
    ...scoreBreakdown.policyRisk.negativeSignals.slice(0, 2)
  ].slice(0, 4);
  const positiveNotes = [
    ...scoreBreakdown.technicalSafety.positiveSignals.slice(0, 2),
    ...scoreBreakdown.companyIdentity.positiveSignals.slice(0, 2),
    ...scoreBreakdown.reputationReviews.positiveSignals.slice(0, 2)
  ].slice(0, 4);
  const mainReasons = [
    ...scoreBreakdown.merchantTrust.negativeSignals.slice(0, 2),
    ...scoreBreakdown.reputationReviews.negativeSignals.slice(0, 2),
    ...scoreBreakdown.companyIdentity.negativeSignals.slice(0, 2)
  ].slice(0, 4);
  const userExplanation = {
    summary:
      finalTrustScore >= 75
        ? "Most signals are supportive, but this is still a snapshot and not a guarantee."
        : finalTrustScore >= 50
          ? "Mixed signals were found. Some trust indicators exist, but multiple caution signals lowered confidence."
          : "Several high-risk signals were found, so the score is conservative.",
    mainReasons,
    positiveNotes,
    cautionNotes,
    recommendation:
      finalTrustScore >= 85
        ? "Proceed with normal caution, and verify return/refund terms before purchase."
        : finalTrustScore >= 65
          ? "Use extra caution: verify seller identity, refund policy, and independent reviews before paying."
          : finalTrustScore >= 45
            ? "Signals are mixed or incomplete. Independently verify identity, ownership, and payment channels before proceeding."
            : finalTrustScore >= 25
              ? "This domain contains patterns commonly associated with phishing or impersonation scams. Avoid entering passwords or payment information unless independently verified."
          : "Avoid sharing payment/personal details until identity and complaint signals are independently verified."
  };
  const unavailableChecks = Array.from(
    new Set(
      [
        ...(input.reviewSignals?.warnings ?? []),
        ...(productMarketplaceDetection.warnings ?? []),
        ...signals
          .filter((s) => /unavailable|failed|timeout|timed out|not configured|skipped/i.test(`${s.label} ${s.reason}`))
          .map((s) => s.label),
        ...(signals.some((s) => s.id === "reviews-google-none") ? ["Google listing lookup inconclusive"] : [])
      ].filter(Boolean)
    )
  );

  return {
    baseScore: BASE_SCORE,
    finalScore,
    verdict,
    confidence,
    riskLabels,
    riskLabelDetails,
    signalSources,
    relatedDomains: rebrandDetection.relatedDomains,
    rebrandNetworkSignals: {
      confidence: rebrandDetection.confidence,
      matchedSignals: rebrandDetection.matchedSignals,
      sharedContentMatches: rebrandDetection.sharedContentMatches,
      sharedInfrastructureMatches: rebrandDetection.sharedInfrastructureMatches,
      sharedIdentityMatches: rebrandDetection.sharedIdentityMatches
    },
    companyIdentitySignals: {
      confidence: companyIdentityDetection.confidence,
      companyName: companyIdentityDetection.companyName,
      legalEntityName: companyIdentityDetection.legalEntityName,
      claimedLocation: companyIdentityDetection.claimedLocation,
      legalAddress: companyIdentityDetection.legalAddress,
      returnAddress: companyIdentityDetection.returnAddress,
      supportEmail: companyIdentityDetection.supportEmail,
      phoneNumber: companyIdentityDetection.phoneNumber,
      registrationNumbers: companyIdentityDetection.registrationNumbers,
      mismatches: companyIdentityDetection.mismatches,
      positiveSignals: companyIdentityDetection.positiveSignals,
      riskSignals: companyIdentityDetection.riskSignals
    },
    productMarketplaceSignals: productMarketplaceDetection,
    outscraperReputation: input.reviewSignals?.outscraper
      ? {
          source: "Outscraper Google Reviews",
          available: input.reviewSignals.outscraper.available,
          rating: input.reviewSignals.outscraper.rating,
          reviewCount: input.reviewSignals.outscraper.reviewCount,
          negativeReviewRatio: input.reviewSignals.outscraper.negativeReviewRatio,
          strongestComplaintThemes: input.reviewSignals.outscraper.strongestComplaintThemes,
          confidence: input.reviewSignals.outscraper.confidence,
          negativeTrend: input.reviewSignals.outscraper.negativeTrend,
          suspiciousPositivePattern: input.reviewSignals.outscraper.suspiciousPositivePattern,
          businessIdentityMismatch: input.reviewSignals.outscraper.businessIdentityMismatch
        }
      : undefined,
    scoreBreakdown,
    scoreCapsApplied,
    userExplanation,
    unavailableChecks,
    signals,
    topPositiveSignals: topPositive,
    topNegativeSignals: topNegative
  };
}
