import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import { publicIntelConfig } from "@/lib/public-intel/config";
import { getPublicIntelEnrichment } from "@/lib/public-intel";
import { sanitizePublicIntelWarningsForUi } from "@/lib/reviewSourceNormalization";
import type { ConfidenceLevel } from "@/types/site-outcome";
import type { Prisma } from "@prisma/client";

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
  cacheStatus?: "hit" | "miss" | "bypassed";
  providerState?: "not_configured" | "not_called" | "failed" | "no_match" | "found";
  providerReason?: string;
  matchedQuery?: string;
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

export function shouldTriggerOutscraper(args: {
  baseRiskScore: number;
  deepScan: boolean;
  confidenceLevel?: ConfidenceLevel;
  missingReviewSignals?: boolean;
}) {
  if (args.deepScan) return true;
  if (args.baseRiskScore >= 40 && args.baseRiskScore <= 80) return true;
  if (args.confidenceLevel === "low") return true;
  if (args.missingReviewSignals) return true;
  return false;
}

function toDisabledResponse(
  domain: string,
  baseRiskScore: number,
  message: string,
  extra?: {
    cacheStatus?: ReputationEnrichment["cacheStatus"];
    providerState?: ReputationEnrichment["providerState"];
  }
): ReputationEnrichment {
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
    cacheStatus: extra?.cacheStatus ?? "miss",
    providerState: extra?.providerState ?? "not_called",
    providerReason: message,
    matchedQuery: domain,
    publicSignals: {
      redditWarnings: 0,
      domainAgeDays: null,
      sslStatus: "unavailable",
      mailSecurity: null,
      confidence: "low",
      warnings: sanitizePublicIntelWarningsForUi([message]),
      sourceStatus
    },
    message
  };
}

const SUCCESS_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const EMPTY_OR_FAILED_TTL_MS = 24 * 60 * 60 * 1000;

function serializeForCache(value: ReputationEnrichment): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function readCache(domain: string): Promise<ReputationEnrichment | null> {
  try {
    const row = await db.reputationEnrichmentCache.findUnique({ where: { normalizedDomain: domain } });
    if (!row) return null;
    if (row.expiresAt.getTime() <= Date.now()) return null;
    if (!row.payload || typeof row.payload !== "object") return null;
    return row.payload as unknown as ReputationEnrichment;
  } catch {
    return null;
  }
}

async function writeCache(domain: string, value: ReputationEnrichment): Promise<void> {
  const success = value.providerState === "found";
  const expiresAt = new Date(Date.now() + (success ? SUCCESS_TTL_MS : EMPTY_OR_FAILED_TTL_MS));
  try {
    await db.reputationEnrichmentCache.upsert({
      where: { normalizedDomain: domain },
      update: {
        status: success ? "success" : value.providerState ?? "empty",
        payload: serializeForCache(value),
        fetchError: success ? null : value.providerReason ?? null,
        expiresAt,
        fetchedAt: new Date()
      },
      create: {
        normalizedDomain: domain,
        provider: "public-intel",
        status: success ? "success" : value.providerState ?? "empty",
        payload: serializeForCache(value),
        fetchError: success ? null : value.providerReason ?? null,
        expiresAt,
        fetchedAt: new Date()
      }
    });
  } catch {
    // Cache persistence is best effort and should not fail a scan.
  }
}

export async function getReputationEnrichment(input: {
  domain: string;
  baseRiskScore: number;
  deepScan: boolean;
  confidenceLevel?: ConfidenceLevel;
  missingReviewSignals?: boolean;
  bypassCache?: boolean;
}): Promise<ReputationEnrichment> {
  const normalizedDomain = normalizeDomain(input.domain);
  const dev = process.env.NODE_ENV !== "production";

  if (!input.bypassCache) {
    const cached = await readCache(normalizedDomain);
    if (cached) {
      const fromCache = {
        ...cached,
        fromCache: true,
        cacheStatus: "hit" as const
      };
      if (dev) {
        console.info("[reputation] cache hit", {
          normalizedDomain,
          providerState: fromCache.providerState,
          source: fromCache.source
        });
      }
      return fromCache;
    }
  }

  if (!publicIntelConfig.enrichmentEnabled) {
    const out = toDisabledResponse(normalizedDomain, input.baseRiskScore, "Provider not configured: enrichment disabled.", {
      cacheStatus: input.bypassCache ? "bypassed" : "miss",
      providerState: "not_configured"
    });
    await writeCache(normalizedDomain, out);
    return out;
  }

  if (
    !shouldTriggerOutscraper({
      baseRiskScore: input.baseRiskScore,
      deepScan: input.deepScan,
      confidenceLevel: input.confidenceLevel,
      missingReviewSignals: input.missingReviewSignals
    })
  ) {
    const out = toDisabledResponse(
      normalizedDomain,
      input.baseRiskScore,
      "Provider not called for this scan. Run deep scan or scan when confidence/review coverage is lower.",
      { cacheStatus: input.bypassCache ? "bypassed" : "miss", providerState: "not_called" }
    );
    return out;
  }

  try {
    if (dev) {
      console.info("[reputation] provider call", {
        normalizedDomain,
        deepScan: input.deepScan,
        hasOutscraperKey: Boolean(process.env.OUTSCRAPER_API_KEY),
        outscraperEnabled: publicIntelConfig.paidSources.outscraper,
        cacheBypassed: Boolean(input.bypassCache)
      });
    }
    const intel = await getPublicIntelEnrichment(normalizedDomain);
    const scored = calculateReputationImpactFromPayload({ impactOnRisk: intel.impactOnRisk });
    const adjustedRisk = clampRisk(input.baseRiskScore + scored.impactOnRisk);
    const trustpilotFound = intel.signals.trustpilotScore != null || intel.signals.trustpilotReviewCount != null;
    const googleFound = intel.signals.googleScore != null || intel.signals.googleReviewCount != null;
    const providerState: ReputationEnrichment["providerState"] = trustpilotFound || googleFound ? "found" : "no_match";
    const providerReason =
      providerState === "found" ? "Review data found." : "Provider returned no review match for this scan.";
    const out: ReputationEnrichment = {
      normalizedDomain,
      signalStatus: scored.signalStatus,
      trustpilotRating: intel.signals.trustpilotScore,
      trustpilotReviewCount: intel.signals.trustpilotReviewCount,
      googleRating: intel.signals.googleScore,
      googleReviewCount: intel.signals.googleReviewCount,
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
      cacheStatus: input.bypassCache ? "bypassed" : "miss",
      providerState,
      providerReason,
      matchedQuery: normalizedDomain,
      trustpilot: {
        rating: intel.signals.trustpilotScore,
        reviewCount: intel.signals.trustpilotReviewCount
      },
      google: {
        rating: intel.signals.googleScore,
        reviewCount: intel.signals.googleReviewCount
      },
      publicSignals: {
        redditWarnings: intel.signals.redditWarnings,
        domainAgeDays: intel.signals.domainAgeDays,
        sslStatus: intel.signals.sslStatus,
        mailSecurity: intel.signals.mailSecurity,
        confidence: intel.signals.confidence,
        warnings: sanitizePublicIntelWarningsForUi(intel.signals.warnings),
        sourceStatus: intel.signals.sourceStatus
      }
    };
    await writeCache(normalizedDomain, out);
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const out = toDisabledResponse(normalizedDomain, input.baseRiskScore, `Provider failed: ${message}`, {
      cacheStatus: input.bypassCache ? "bypassed" : "miss",
      providerState: "failed"
    });
    await writeCache(normalizedDomain, out);
    return out;
  } finally {
    if (dev) {
      console.info("[reputation] completed", {
        normalizedDomain
      });
    }
  }
}
