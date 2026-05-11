import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import { publicIntelConfig } from "@/lib/public-intel/config";
import { getPublicIntelEnrichment } from "@/lib/public-intel";
import { sanitizePublicIntelWarningsForUi } from "@/lib/reviewSourceNormalization";
import type { ConfidenceLevel } from "@/types/site-outcome";
import type { Prisma } from "@prisma/client";

export type ReputationSignalStatus = "Positive" | "Mixed" | "Weak" | "Missing";
type ReputationProviderStatus = "not_run" | "cache_hit" | "data_found" | "no_match" | "provider_unavailable" | "failed";
export type ReputationStatus = "not_run" | "cache_hit" | "called_found" | "called_no_match" | "provider_error" | "disabled";
export type ReputationScanStage = "standard" | "deep";

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
  reputationStatus?: ReputationStatus;
  reputationScanStage?: ReputationScanStage;
  reputationSkippedReason?: string | null;
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
  reputationDebug?: {
    enabled: boolean;
    apiKeyPresent: boolean;
    cacheStatus: "hit" | "miss" | "bypassed";
    calledProvider: boolean;
    skippedReason: string | null;
    providerStatus: ReputationProviderStatus;
    normalizedDomain: string;
    lastChecked: string;
    triggerReason: string | null;
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
  // Standard scans should still run lightweight reputation lookup (cache-first) when enabled.
  if (!args.deepScan) return true;
  return args.deepScan;
}

function resolveTriggerReason(args: {
  deepScan: boolean;
  baseRiskScore: number;
  confidenceLevel?: ConfidenceLevel;
  missingReviewSignals?: boolean;
}): string | null {
  if (args.deepScan) return "deep_scan";
  return "standard_cache_first";
}

function toDisabledResponse(
  domain: string,
  baseRiskScore: number,
  message: string,
  extra?: {
    cacheStatus?: ReputationEnrichment["cacheStatus"];
    providerState?: ReputationEnrichment["providerState"];
    skippedReason?: string | null;
    providerStatus?: ReputationProviderStatus;
    triggerReason?: string | null;
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
    reputationStatus: extra?.providerStatus === "provider_unavailable" ? "disabled" : "not_run",
    reputationScanStage: extra?.triggerReason === "deep_scan" ? "deep" : "standard",
    reputationSkippedReason: extra?.skippedReason ?? message,
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
    reputationDebug: {
      enabled: publicIntelConfig.paidSources.outscraper,
      apiKeyPresent: Boolean(process.env.OUTSCRAPER_API_KEY),
      cacheStatus: extra?.cacheStatus ?? "miss",
      calledProvider: false,
      skippedReason: extra?.skippedReason ?? message,
      providerStatus: extra?.providerStatus ?? "not_run",
      normalizedDomain: domain,
      lastChecked: new Date().toISOString(),
      triggerReason: extra?.triggerReason ?? null
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
  const apiKeyPresent = Boolean(process.env.OUTSCRAPER_API_KEY);
  const outscraperEnabled = publicIntelConfig.paidSources.outscraper;
  const triggerReason = resolveTriggerReason({
    deepScan: input.deepScan,
    baseRiskScore: input.baseRiskScore,
    confidenceLevel: input.confidenceLevel,
    missingReviewSignals: input.missingReviewSignals
  });
  const scanStage: ReputationScanStage = input.deepScan ? "deep" : "standard";

  if (!input.bypassCache) {
    const cached = await readCache(normalizedDomain);
    if (cached) {
      const fromCache = {
        ...cached,
        fromCache: true,
        cacheStatus: "hit" as const,
        reputationDebug: {
          enabled: outscraperEnabled,
          apiKeyPresent,
          cacheStatus: "hit" as const,
          calledProvider: false,
          skippedReason: "served_from_cache",
          providerStatus: "cache_hit" as const,
          normalizedDomain,
          lastChecked: cached.lastUpdated,
          triggerReason
        },
        reputationStatus: "cache_hit" as const,
        reputationScanStage: scanStage,
        reputationSkippedReason: "served_from_cache"
      };
      if (dev) {
        console.info("[reputation] cache hit", {
          scanStage,
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
      providerState: "not_configured",
      skippedReason: "public_intel_disabled",
      providerStatus: "provider_unavailable",
      triggerReason
    });
    out.reputationStatus = "disabled";
    out.reputationScanStage = scanStage;
    out.reputationSkippedReason = "public_intel_disabled";
    await writeCache(normalizedDomain, out);
    return out;
  }

  if (!outscraperEnabled || !apiKeyPresent) {
    const skippedReason = !outscraperEnabled ? "outscraper_feature_disabled" : "outscraper_api_key_missing";
    const out = toDisabledResponse(
      normalizedDomain,
      input.baseRiskScore,
      "Review provider unavailable.",
      {
        cacheStatus: input.bypassCache ? "bypassed" : "miss",
        providerState: "not_configured",
        skippedReason,
        providerStatus: "provider_unavailable",
        triggerReason
      }
    );
    out.reputationStatus = "disabled";
    out.reputationScanStage = scanStage;
    out.reputationSkippedReason = skippedReason;
    if (dev) {
      console.info("[reputation] provider unavailable", {
        scanStage,
        domain: input.domain,
        normalizedDomain,
        outscraperEnabled,
        apiKeyPresent,
        skippedReason
      });
    }
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
      {
        cacheStatus: input.bypassCache ? "bypassed" : "miss",
        providerState: "not_called",
        skippedReason: "trigger_conditions_not_met",
        providerStatus: "not_run",
        triggerReason
      }
    );
    out.reputationStatus = "not_run";
    out.reputationScanStage = scanStage;
    out.reputationSkippedReason = "trigger_conditions_not_met";
    if (dev) {
      console.info("[reputation] skipped provider call", {
        scanStage,
        domain: input.domain,
        normalizedDomain,
        triggerReason,
        skippedReason: "trigger_conditions_not_met"
      });
    }
    return out;
  }

  try {
    if (dev) {
      console.info("[reputation] provider call", {
        scanStage,
        domain: input.domain,
        normalizedDomain,
        deepScan: input.deepScan,
        hasOutscraperKey: apiKeyPresent,
        outscraperEnabled,
        cacheBypassed: Boolean(input.bypassCache),
        triggerReason,
        apiEndpointCalled: "getPublicIntelEnrichment"
      });
    }
    const intel = await getPublicIntelEnrichment(normalizedDomain);
    const scored = calculateReputationImpactFromPayload({ impactOnRisk: intel.impactOnRisk });
    const adjustedRisk = clampRisk(input.baseRiskScore + scored.impactOnRisk);
    const trustpilotFound = intel.signals.trustpilotScore != null || intel.signals.trustpilotReviewCount != null;
    const googleFound = intel.signals.googleScore != null || intel.signals.googleReviewCount != null;
    const providerState: ReputationEnrichment["providerState"] = trustpilotFound || googleFound ? "found" : "no_match";
    const providerReason = providerState === "found" ? "Review data found." : "No matching review profile found.";
    const out: ReputationEnrichment = {
      normalizedDomain,
      signalStatus: scored.signalStatus,
      trustpilotRating: intel.signals.trustpilotScore,
      trustpilotReviewCount: intel.signals.trustpilotReviewCount,
      googleRating: intel.signals.googleScore,
      googleReviewCount: intel.signals.googleReviewCount,
      latestReviewDate: null,
      sentimentSummary: null,
      businessName: intel.signals.businessName,
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
      reputationStatus: providerState === "found" ? "called_found" : "called_no_match",
      reputationScanStage: scanStage,
      reputationSkippedReason: null,
      matchedQuery: intel.signals.matchedQuery ?? normalizedDomain,
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
      },
      reputationDebug: {
        enabled: outscraperEnabled,
        apiKeyPresent,
        cacheStatus: input.bypassCache ? "bypassed" : "miss",
        calledProvider: true,
        skippedReason: null,
        providerStatus: providerState === "found" ? "data_found" : "no_match",
        normalizedDomain,
        lastChecked: new Date().toISOString(),
        triggerReason
      }
    };
    if (dev) {
      console.info("[reputation] provider response", {
        scanStage,
        domain: input.domain,
        normalizedDomain,
        providerState,
        providerReason,
        trustpilot: {
          rating: out.trustpilotRating,
          reviewCount: out.trustpilotReviewCount
        },
        googleReviews: {
          rating: out.googleRating,
          reviewCount: out.googleReviewCount
        }
      });
    }
    await writeCache(normalizedDomain, out);
    return out;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const out = toDisabledResponse(normalizedDomain, input.baseRiskScore, "Review provider unavailable.", {
      cacheStatus: input.bypassCache ? "bypassed" : "miss",
      providerState: "failed",
      skippedReason: message,
      providerStatus: "failed",
      triggerReason
    });
    out.reputationStatus = "provider_error";
    out.reputationScanStage = scanStage;
    out.reputationSkippedReason = message;
    await writeCache(normalizedDomain, out);
    return out;
  } finally {
    if (dev) {
      console.info("[reputation] completed", {
        scanStage,
        normalizedDomain
      });
    }
  }
}
