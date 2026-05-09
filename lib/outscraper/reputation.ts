import { normalizeDomain } from "@/lib/cache";
import { publicIntelConfig } from "@/lib/public-intel/config";
import { getPublicIntelEnrichment } from "@/lib/public-intel";

export type ReputationSignalStatus = "Positive" | "Mixed" | "Weak" | "Missing";

export interface ReputationEnrichment {
  normalizedDomain: string;
  signalStatus: ReputationSignalStatus;
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  latestReviewDate: string | null;
  sentimentSummary: string | null;
  businessName: string | null;
  businessNameMatch: boolean | null;
  reviewSpikeSuspected: boolean;
  impactOnRisk: number;
  adjustedRiskScore: number;
  adjustedTrustScore: number;
  lastUpdated: string;
  fromCache: boolean;
  source: "public-intel" | "none";
  trustpilot?: { rating: number | null; reviewCount: number | null };
  google?: { rating: number | null; reviewCount: number | null };
  publicSignals?: {
    redditWarnings: number;
    domainAgeDays: number | null;
    sslStatus: "valid" | "invalid" | "unavailable";
    mailSecurity: { mxConfigured: boolean; spf: boolean; dmarc: boolean } | null;
    confidence: "low" | "medium" | "high";
    warnings: string[];
    sourceStatus: Record<
      | "trustpilot"
      | "reddit"
      | "scamadviser"
      | "dns"
      | "ssl"
      | "rdap"
      | "googleIndexedReviews"
      | "outscraper"
      | "googlePlacesReviews"
      | "trustpilotPrivateApi",
      { enabled: boolean; attempted: boolean; ok: boolean; fromCache: boolean; warning?: string }
    >;
  };
  message?: string;
}

function clampRisk(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function calculateReputationImpactFromPayload(payload: { impactOnRisk: number }): {
  impactOnRisk: number;
  signalStatus: ReputationSignalStatus;
} {
  const impact = Math.max(-15, Math.min(20, payload.impactOnRisk));
  if (impact === 0) return { impactOnRisk: 0, signalStatus: "Missing" };
  if (impact <= -8) return { impactOnRisk: impact, signalStatus: "Positive" };
  if (impact >= 10) return { impactOnRisk: impact, signalStatus: "Weak" };
  return { impactOnRisk: impact, signalStatus: "Mixed" };
}

export function shouldTriggerOutscraper(args: { baseRiskScore: number; deepScan: boolean }) {
  if (args.deepScan) return true;
  return args.baseRiskScore >= 40 && args.baseRiskScore <= 80;
}

function toDisabledResponse(domain: string, baseRiskScore: number, message: string): ReputationEnrichment {
  const sourceStatus: NonNullable<ReputationEnrichment["publicSignals"]>["sourceStatus"] = {
    trustpilot: { enabled: publicIntelConfig.publicSources.trustpilot, attempted: false, ok: false, fromCache: false },
    reddit: { enabled: publicIntelConfig.publicSources.reddit, attempted: false, ok: false, fromCache: false },
    scamadviser: { enabled: publicIntelConfig.publicSources.scamadviser, attempted: false, ok: false, fromCache: false },
    dns: { enabled: publicIntelConfig.publicSources.dns, attempted: false, ok: false, fromCache: false },
    ssl: { enabled: publicIntelConfig.publicSources.ssl, attempted: false, ok: false, fromCache: false },
    rdap: { enabled: publicIntelConfig.publicSources.rdap, attempted: false, ok: false, fromCache: false },
    googleIndexedReviews: {
      enabled: publicIntelConfig.publicSources.googleIndexedReviews,
      attempted: false,
      ok: false,
      fromCache: false
    },
    outscraper: { enabled: publicIntelConfig.paidSources.outscraper, attempted: false, ok: false, fromCache: false },
    googlePlacesReviews: {
      enabled: publicIntelConfig.paidSources.googlePlacesReviews,
      attempted: false,
      ok: false,
      fromCache: false
    },
    trustpilotPrivateApi: {
      enabled: publicIntelConfig.paidSources.trustpilotPrivateApi,
      attempted: false,
      ok: false,
      fromCache: false
    }
  };
  const adjustedRisk = clampRisk(baseRiskScore);
  return {
    normalizedDomain: domain,
    signalStatus: "Missing",
    trustpilotRating: null,
    trustpilotReviewCount: null,
    googleRating: null,
    googleReviewCount: null,
    latestReviewDate: null,
    sentimentSummary: null,
    businessName: null,
    businessNameMatch: null,
    reviewSpikeSuspected: false,
    impactOnRisk: 0,
    adjustedRiskScore: adjustedRisk,
    adjustedTrustScore: 100 - adjustedRisk,
    lastUpdated: new Date().toISOString(),
    fromCache: false,
    source: "none",
    publicSignals: {
      redditWarnings: 0,
      domainAgeDays: null,
      sslStatus: "unavailable",
      mailSecurity: null,
      confidence: "low",
      warnings: [message],
      sourceStatus
    },
    message
  };
}

export async function getReputationEnrichment(input: {
  domain: string;
  baseRiskScore: number;
  deepScan: boolean;
}): Promise<ReputationEnrichment> {
  const normalizedDomain = normalizeDomain(input.domain);

  if (!publicIntelConfig.enrichmentEnabled) {
    return toDisabledResponse(normalizedDomain, input.baseRiskScore, "Public-source enrichment is disabled.");
  }

  if (!shouldTriggerOutscraper({ baseRiskScore: input.baseRiskScore, deepScan: input.deepScan })) {
    return toDisabledResponse(normalizedDomain, input.baseRiskScore, "Skipped public-source lookup; base scan confidence is sufficient.");
  }

  try {
    const intel = await getPublicIntelEnrichment(normalizedDomain);
    const scored = calculateReputationImpactFromPayload({ impactOnRisk: intel.impactOnRisk });
    const adjustedRisk = clampRisk(input.baseRiskScore + scored.impactOnRisk);
    return {
      normalizedDomain,
      signalStatus: scored.signalStatus,
      trustpilotRating: intel.signals.trustpilotScore,
      trustpilotReviewCount: intel.signals.trustpilotReviewCount,
      googleRating: null,
      googleReviewCount: null,
      latestReviewDate: null,
      sentimentSummary: null,
      businessName: null,
      businessNameMatch: null,
      reviewSpikeSuspected: false,
      impactOnRisk: scored.impactOnRisk,
      adjustedRiskScore: adjustedRisk,
      adjustedTrustScore: 100 - adjustedRisk,
      lastUpdated: new Date().toISOString(),
      fromCache: false,
      source: "public-intel",
      trustpilot: {
        rating: intel.signals.trustpilotScore,
        reviewCount: intel.signals.trustpilotReviewCount
      },
      google: {
        rating: null,
        reviewCount: null
      },
      publicSignals: {
        redditWarnings: intel.signals.redditWarnings,
        domainAgeDays: intel.signals.domainAgeDays,
        sslStatus: intel.signals.sslStatus,
        mailSecurity: intel.signals.mailSecurity,
        confidence: intel.signals.confidence,
        warnings: intel.signals.warnings,
        sourceStatus: intel.signals.sourceStatus
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return toDisabledResponse(normalizedDomain, input.baseRiskScore, `Public-source lookup failed: ${message}`);
  }
}
