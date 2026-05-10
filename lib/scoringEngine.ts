import type { DomainPatternAnalysis } from "@/lib/domainPatternHeuristics";
import { analyzeDomainPatterns } from "@/lib/domainPatternHeuristics";
import type { ReviewSignals } from "@/lib/reviewSignals";
import type { ScoringIdentityContext } from "@/lib/scoringIdentityContext";
import { computeTrustAnchors } from "@/lib/scoringIdentityContext";
import type { SupplyChainSignals } from "@/lib/supplyChainSignals";
import { verdictFromAssessment } from "@/lib/trustSystem";

export type ScoreConfidence = "low" | "medium" | "high";

export type ScoreEvidenceTier =
  | "confirmed_malicious"
  | "positive_trust"
  | "neutral_observation"
  | "risk_indicator"
  | "missing_data";

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
  /** Guides UI grouping; omission falls back to simple impact heuristics. */
  evidenceTier?: ScoreEvidenceTier;
}

export interface ScoreResult {
  baseScore: number;
  finalScore: number;
  verdict: "safe" | "suspicious" | "scam";
  signals: ScoreSignal[];
  topPositiveSignals: ScoreSignal[];
  topNegativeSignals: ScoreSignal[];
  /** Max trust (0–100) after guardrail caps; same semantics as UI trust score cap. */
  trustScoreCap?: number;
  /** When set, “Trusted” was blocked because no anchored identity/reputation evidence was available. */
  trustedBlockedReason?: "no_trust_anchor";
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

/** Optional DNS mail-auth probe (MX + SPF + DMARC) — small trust nudge when aligned. */
export type MailDnsHints = {
  mxConfigured: boolean;
  hasSpf: boolean;
  hasDmarc: boolean;
};

const CONF_MULT: Record<ScoreConfidence, number> = {
  low: 0.5,
  medium: 0.75,
  high: 1.0
};

// Keep neutral baseline low enough that reputable low-risk domains (e.g. apple.com)
// do not accidentally land in Caution when major risk signals are absent.
const BASE_SCORE = 16;
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
      reason: s.reason,
      evidenceTier: s.evidenceTier
    }))
  );
}

const MISSING_SCORE_IDS = new Set([
  "missing-rdap-registration",
  "missing-registration-date",
  "missing-registration-age-estimate",
  "missing-registrar",
  "unknown-ownership-anchor",
  "indexing-or-robots-limited",
  "reputation-footprint-thin"
]);

export function inferScoreEvidenceTier(signal: Pick<ScoreSignal, "id" | "impact" | "evidenceTier">): ScoreEvidenceTier {
  if (signal.evidenceTier) return signal.evidenceTier;
  if (MISSING_SCORE_IDS.has(signal.id)) return "missing_data";
  if (signal.impact > 0) return "risk_indicator";
  if (signal.impact < 0) return "positive_trust";
  return "neutral_observation";
}

const MISSING_DATA_WEIGHTED_RISK_CAP = 10;

/** Extra risk mass from “missing / unavailable” signals is capped so absent data does not read as strong guilt. */
export function computeMissingDataRiskOverage(
  signals: ScoreSignal[],
  weights: Map<string, number>,
  cap: number = MISSING_DATA_WEIGHTED_RISK_CAP
): number {
  let sum = 0;
  for (const s of signals) {
    if (inferScoreEvidenceTier(s) !== "missing_data") continue;
    const w = weights.get(s.id) ?? 0;
    if (w > 0) sum += w;
  }
  return Math.max(0, sum - cap);
}

function inferConfirmedMalicious(
  signals: ScoreSignal[],
  intel?: { confirmedMalicious: boolean }
): boolean {
  if (intel?.confirmedMalicious) return true;
  return signals.some((s) => s.evidenceTier === "confirmed_malicious" && s.impact > 0);
}

function pushMailDnsTrustSignals(hints: MailDnsHints | null | undefined, out: ScoreSignal[]): void {
  if (!hints) return;
  const { mxConfigured, hasSpf, hasDmarc } = hints;
  if (mxConfigured && hasSpf && hasDmarc) {
    out.push({
      id: "infra-emailauth-stack",
      label: "MX with SPF and DMARC present",
      category: "website_quality",
      impact: -5,
      confidence: "medium",
      evidenceTier: "positive_trust",
      reason:
        "Public DNS shows mail exchangers plus SPF and DMARC records—a modest operational anchor when other reputation data is thin."
    });
    return;
  }
  if (mxConfigured && (hasSpf || hasDmarc)) {
    out.push({
      id: "infra-emailauth-partial",
      label: "Mail exchangers with SPF or DMARC",
      category: "website_quality",
      impact: -3,
      confidence: "low",
      evidenceTier: "positive_trust",
      reason: "MX exists and at least SPF or DMARC is published—common for serious domains and slightly reassuring when intel is incomplete."
    });
  }
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

function shouldSkipStructuralTrustNudges(tier: ReviewTierFlags, ctx: ScoringIdentityContext | undefined): boolean {
  if (tier.strongPublicReview || tier.elitePositive) return true;
  if (!ctx) return false;
  if (ctx.limitedPublicReputation && ctx.ownershipUnverifiable) return true;
  if (ctx.limitedPublicReputation && ctx.domainPatterns.hasStrongLexicalSuspicion) return true;
  return false;
}

/** Trust nudges for clean domains — suppressed when reputation/identity hooks are absent and ownership is flaky. */
function pushDomainTrustSignals(
  domain: string,
  out: ScoreSignal[],
  tier: ReviewTierFlags,
  ctx: ScoringIdentityContext | undefined
): void {
  const d = domain.toLowerCase();
  const risky = ["cheap", "free", "deal"];
  const matched = risky.filter((w) => d.includes(w));
  const skipBaitAndLength = shouldSkipStructuralTrustNudges(tier, ctx);

  if (matched.length === 0 && !skipBaitAndLength) {
    out.push({
      id: "domain-no-bait-keywords",
      label: "No bait keywords in domain",
      category: "domain",
      impact: -5,
      confidence: "medium",
      evidenceTier: "neutral_observation",
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
      evidenceTier: "neutral_observation",
      reason: "Hostname length looks typical rather than excessively long."
    });
  }
}

function pushDomainPatternSignals(patterns: DomainPatternAnalysis, out: ScoreSignal[]): void {
  if (patterns.officialRegistrableExempt) return;

  const ps = patterns.publicSuffix;
  const tier = patterns.tldRiskTier;
  if (tier === "soft") {
    out.push({
      id: "domain-soft-commodity-tld",
      label: "Startup-style TLD pattern",
      category: "domain",
      impact: 4,
      confidence: "low",
      evidenceTier: "risk_indicator",
      reason: `The apex uses a trendy TLD (.${ps}) seen in many harmless projects; Fraudly applies only a small nudge unless other spoofing cues appear.`
    });
  } else if (tier === "hard") {
    out.push({
      id: "domain-hard-commodity-tld",
      label: "High-disposable TLD pattern",
      category: "domain",
      impact: 10,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: `The apex sits on a commoditized TLD (.${ps}) that is over-represented in throwaway hosts; still not proof of abuse by itself.`
    });
  }

  const { fakeAuthoritySubstringInApex: fake } = patterns;
  const gib = patterns.combinedGibberishApex;
  const dec = patterns.deceptiveSubdomainPattern;

  if (fake && (tier === "hard" || gib || dec)) {
    const apexLabel = patterns.apexLabels[0] ?? "";
    const governmentShim = /gov|government|overheid|ministerie/i.test(apexLabel) && tier !== "none";
    const title = governmentShim ? "Government-like wording on a non-government domain" : "Authority / urgency wording in a suspicious hostname";
    out.push({
      id: "domain-fake-authority-strong",
      label: title,
      category: "domain",
      impact: 22,
      confidence: "high",
      evidenceTier: "risk_indicator",
      reason:
        "Authority, tax, or civic-looking language appears on an apex that Fraudly does not treat as a documented government namespace."
    });
  } else if (fake && tier === "soft") {
    out.push({
      id: "domain-authority-token-with-soft-tld",
      label: "Authority-themed wording plus startup-style TLD",
      category: "domain",
      impact: 11,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason:
        "Combined authority vocabulary and a fashionable TLD warrants extra scrutiny but is not automatic proof of phishing."
    });
  } else if (fake) {
    out.push({
      id: "domain-authority-token-context",
      label: "Authority-themed wording inside registrable host",
      category: "domain",
      impact: 7,
      confidence: "low",
      evidenceTier: "risk_indicator",
      reason: "Neutral-to-suspicious wording cue without the stronger disposable-TLD or gibberish corroboration."
    });
  }

  if (dec) {
    out.push({
      id: "domain-deceptive-prefix",
      label: "Suspicious subdomain + apex combination",
      category: "domain",
      impact: 14,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: "A very short subdomain sits ahead of a disparate random-looking apex."
    });
  }

  if (gib && tier === "hard") {
    out.push({
      id: "domain-multi-signal-gibberish",
      label: "Machine-like domain label (multiple signals agree)",
      category: "domain",
      impact: 16,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason:
        "Several independent structure checks (entropy, vowel balance, consonant runs) align on a disposable TLD apex."
    });
  } else if (gib && tier === "soft") {
    out.push({
      id: "domain-multi-signal-gibberish-soft",
      label: "Unusually random-looking apex on a trendy TLD",
      category: "domain",
      impact: 9,
      confidence: "medium",
      evidenceTier: "risk_indicator",
      reason: "Multiple lexical checks agree this label is unusually random for a benign brand, but the suffix itself is commonly legitimate."
    });
  }
}

function pushUnknownIdentitySignals(ctx: ScoringIdentityContext | undefined, out: ScoreSignal[]): void {
  if (!ctx) return;

  /** Official namespaces get minimal stewardship penalties (identity is corroborated by policy lists). */
  if (ctx.domainPatterns.officialRegistrableExempt) return;

  if (ctx.rdapFailed) {
    out.push({
      id: "missing-rdap-registration",
      label: "Domain registration data unavailable",
      category: "domain",
      impact: 3,
      confidence: "low",
      evidenceTier: "missing_data",
      reason:
        "RDAP could not be read in this run (timeout, error, or rate limit). That limits how well we can date the domain—it is logged as limited evidence, not as proof the site is unsafe."
    });
  } else {
    if (ctx.registrationDateUnknown) {
      out.push({
        id: "missing-registration-date",
        label: "Domain registration date unknown",
        category: "domain",
        impact: 2,
        confidence: "low",
        evidenceTier: "missing_data",
        reason: "Registration timestamps were not parsed cleanly; this lowers rating confidence, not direct safety proof."
      });
    }
    if (ctx.domainAgeUnknown) {
      out.push({
        id: "missing-registration-age-estimate",
        label: "Domain age unknown",
        category: "domain",
        impact: 2,
        confidence: "low",
        evidenceTier: "missing_data",
        reason: "Age-based heuristics are blind without creation events—treat as weaker calibration only."
      });
    }
    if (ctx.registrarUnknown) {
      out.push({
        id: "missing-registrar",
        label: "Registrar unstated in parsed RDAP",
        category: "domain",
        impact: 1,
        confidence: "low",
        evidenceTier: "missing_data",
        reason: "Registrar narration was missing—minor uncertainty, not a scam indicator."
      });
    }
  }

  if (ctx.ownershipUnverifiable) {
    out.push({
      id: "unknown-ownership-anchor",
      label: "Domain ownership could not be verified from public registration data",
      category: "domain",
      impact: 3,
      confidence: "low",
      evidenceTier: "missing_data",
      reason:
        "WHOIS/RDAP did not expose corroboratable registrant signals in this crawl. That is common and mainly reduces how confidently we can score—not evidence of impersonation by itself."
    });
  }

  /** Robots/disallow friction and sparse review footprints are surfaced via confidence tooling, not strong risk boosts. */

  void ctx.robotsLikelyBlocked;
  void ctx.limitedPublicReputation;
}

function trustCapReliefEligible(
  ctx: ScoringIdentityContext,
  anchors: ReturnType<typeof computeTrustAnchors>
): boolean {
  if (ctx.domainPatterns.officialRegistrableExempt) return true;
  if (anchors.hasStrongReputation || anchors.hasAnchoredReputation) return true;
  if (!ctx.rdapFailed && typeof ctx.ageDaysKnown === "number" && ctx.ageDaysKnown >= 730) return true;
  return false;
}

function computeTrustScoreCap(args: {
  ctx: ScoringIdentityContext;
  lexicalStrong: boolean;
  anchors: ReturnType<typeof computeTrustAnchors>;
  benignTechnicalBaseline: boolean;
  confirmedMalicious: boolean;
}): number {
  if (args.confirmedMalicious) return 100;

  let maxTrust = 100;
  const c = args.ctx;
  const p = c.domainPatterns;
  const relief = trustCapReliefEligible(c, args.anchors);

  if (c.rdapFailed || c.domainAgeUnknown) {
    maxTrust = Math.min(maxTrust, relief ? 84 : 76);
  }
  if (c.rdapFailed && args.lexicalStrong) {
    maxTrust = Math.min(maxTrust, relief ? 58 : 44);
  }
  if (c.ownershipUnverifiable) {
    if (args.benignTechnicalBaseline && !args.lexicalStrong && c.rdapFailed) {
      maxTrust = Math.min(maxTrust, relief ? 72 : 58);
    } else {
      maxTrust = Math.min(maxTrust, relief ? 42 : 34);
    }
  }
  if (p.tldRiskTier !== "none" && p.fakeAuthoritySubstringInApex && c.limitedPublicReputation) {
    const tight = p.tldRiskTier === "hard" || args.lexicalStrong;
    maxTrust = Math.min(maxTrust, tight ? (relief ? 38 : 30) : relief ? 52 : 44);
  }

  if (relief) {
    maxTrust = Math.min(100, Math.max(maxTrust, anchorsAdjustFloor(args.anchors, c)));
  }
  return maxTrust;
}

function anchorsAdjustFloor(
  anchors: ReturnType<typeof computeTrustAnchors>,
  ctx: ScoringIdentityContext
): number {
  if (ctx.domainPatterns.officialRegistrableExempt) return 88;
  if (anchors.hasStrongReputation) return 82;
  if (anchors.hasAnchoredReputation) return 76;
  if (!ctx.rdapFailed && typeof ctx.ageDaysKnown === "number" && ctx.ageDaysKnown >= 730) return 72;
  return 72;
}

function eligibleForTrustedLabel(args: {
  ctx: ScoringIdentityContext | undefined;
  lexicalStrong: boolean;
  anchors: ReturnType<typeof computeTrustAnchors>;
}): boolean {
  if (args.anchors.hasStrongReputation || args.anchors.hasAnchoredReputation) return true;
  if (args.ctx?.domainPatterns.officialRegistrableExempt && !args.lexicalStrong) return true;
  if (
    args.ctx &&
    !args.ctx.rdapFailed &&
    typeof args.ctx.ageDaysKnown === "number" &&
    args.ctx.ageDaysKnown >= 365 &&
    !args.lexicalStrong
  ) {
    return true;
  }
  return false;
}

function pushAiRiskSignals(level: AiRiskSignalsInput["level"], out: ScoreSignal[], tier: ReviewTierFlags): void {
  if (!level) return;
  if (level === "low" && !tier.elitePositive) {
    out.push({
      id: "ai-risk-low",
      label: "AI assessment: low risk",
      category: "ai",
      impact: -4,
      confidence: "medium",
      reason:
        "AI summary suggested low narrative risk — this adjustment is capped so deterministic intel always dominates scoring."
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
      evidenceTier: "positive_trust",
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
      evidenceTier: "positive_trust",
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
      evidenceTier: "risk_indicator",
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

export type IntelSurfaceInput = {
  confirmedMalicious: boolean;
  /** Valid HTTPS observed — relaxes “unknown identity” trust caps when no confirmed threats. */
  benignTechnicalBaseline?: boolean;
};

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
  /** When omitted, guardrails stay permissive so offline/unit checks stay deterministic. */
  scoringContext?: ScoringIdentityContext;
  /** Tier‑1 threat matches + connectivity hints for trust caps and verdicts. */
  intelSurface?: IntelSurfaceInput;
  mailDnsHints?: MailDnsHints | null;
}): ScoreResult {
  void input.heuristicReasons;

  const signals: ScoreSignal[] = [];
  const domain = input.domain.toLowerCase();
  const reviewTier = computeReviewTierFlags(input.reviewSignals);
  const patterns: DomainPatternAnalysis =
    input.scoringContext?.domainPatterns ?? analyzeDomainPatterns(domain);

  pushDomainSignals(domain, signals);
  pushDomainPatternSignals(patterns, signals);
  if (input.reviewSignals) pushReviewSignals(input.reviewSignals, signals);
  if (input.supplyChainSignals) {
    const allowSupplyRisk = input.supplyChainSignals.scoreAdjustment > 0;
    pushSupplyChainSignals(input.supplyChainSignals, signals, allowSupplyRisk);
  }

  const inferredAddr = inferAddressSignals(input.websiteText ?? "");
  const addr: AddressSignalsInput = { ...inferredAddr, ...input.addressSignals };
  pushBusinessIdentitySignals(addr, input.websiteText ?? "", signals);
  pushDomainAgeSignals(input.domainAgeSignals, signals);
  pushUnknownIdentitySignals(input.scoringContext, signals);
  pushDomainTrustSignals(domain, signals, reviewTier, input.scoringContext);
  pushAiRiskSignals(input.aiRiskSignals?.level, signals, reviewTier);
  if (input.externalSignals?.length) {
    signals.push(...input.externalSignals);
  }
  pushMailDnsTrustSignals(input.mailDnsHints, signals);

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
  total -= computeMissingDataRiskOverage(signals, allWeights);

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

  let finalScore = Math.max(0, Math.min(100, Math.round(total)));

  let trustScoreCap: number | undefined;
  let trustedBlockedReason: ScoreResult["trustedBlockedReason"];

  const confirmedMalicious = inferConfirmedMalicious(signals, input.intelSurface);

  if (input.scoringContext) {
    const lexicalStrong = patterns.hasStrongLexicalSuspicion;
    const anchors = computeTrustAnchors(input.scoringContext.ageDaysKnown, input.reviewSignals);
    trustScoreCap = computeTrustScoreCap({
      ctx: input.scoringContext,
      lexicalStrong,
      anchors,
      benignTechnicalBaseline: Boolean(input.intelSurface?.benignTechnicalBaseline),
      confirmedMalicious
    });

    let trustScore = Math.max(0, Math.min(100, Math.round(100 - finalScore)));
    if (trustScore > trustScoreCap) {
      trustScore = trustScoreCap;
      finalScore = Math.max(0, Math.min(100, Math.round(100 - trustScore)));
    }
    if (
      trustScore >= 80 &&
      !eligibleForTrustedLabel({
        ctx: input.scoringContext,
        lexicalStrong,
        anchors
      })
    ) {
      trustedBlockedReason = "no_trust_anchor";
      trustScore = Math.min(trustScore, 79);
      finalScore = Math.max(0, Math.min(100, Math.round(100 - trustScore)));
    }

    /** Hard rule: brittle identity + spoofing-shaped host cannot advertise “trusted”. */
    if (
      input.scoringContext.ownershipUnverifiable &&
      lexicalStrong &&
      trustScore >= 70
    ) {
      trustScore = Math.min(trustScore, 49);
      finalScore = Math.max(0, Math.min(100, Math.round(100 - trustScore)));
    }
  }

  const verdict = verdictFromAssessment({
    riskScore: finalScore,
    confirmedMalicious,
    lexicalStrong: patterns.hasStrongLexicalSuspicion
  });

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
    topNegativeSignals: topNegative,
    trustScoreCap: input.scoringContext ? trustScoreCap : undefined,
    trustedBlockedReason
  };
}
