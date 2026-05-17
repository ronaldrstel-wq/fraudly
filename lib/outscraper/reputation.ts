import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  fetchOutscraperReviewSignals,
  type GoogleLookupMeta,
  type TrustpilotLookupMeta
} from "@/lib/outscraper/api";
import type { GoogleMatchConfidence } from "@/lib/reputation/googleMatch";
import type { CompanyIdentity } from "@/lib/reputation/companyIdentity";
import { MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS } from "@/lib/reputation/reviewConfig";
import type { TrustpilotMatchConfidence } from "@/lib/reputation/trustpilotMatch";
import { logReputationEnrichmentFromResult } from "@/lib/outscraper/reputationLog";
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
  trustpilotLookup?: TrustpilotLookupMeta;
  trustpilotMatchConfidence?: TrustpilotMatchConfidence | "none";
  googleLookup?: GoogleLookupMeta;
  googleMatchConfidence?: GoogleMatchConfidence | "none";
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
const NO_MATCH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PROVIDER_ERROR_TTL_MS = 24 * 60 * 60 * 1000;
const LOW_CONFIDENCE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function resolveCacheTtlMs(value: ReputationEnrichment): number {
  if (value.providerState === "failed" || value.reputationStatus === "provider_error") {
    return PROVIDER_ERROR_TTL_MS;
  }
  const tpConfidence = value.trustpilotLookup?.confidence ?? value.trustpilotMatchConfidence ?? "none";
  const googleConf = value.googleMatchConfidence ?? value.googleLookup?.confidence ?? "none";
  const hasGoogle =
    googleConf === "high" &&
    value.googleLookup?.exactDomainMatch === true &&
    value.googleRating != null &&
    value.googleReviewCount != null;
  const hasTrustpilot = tpConfidence === "high" || tpConfidence === "medium";
  if (hasGoogle || hasTrustpilot) return SUCCESS_TTL_MS;
  if (tpConfidence === "low") return LOW_CONFIDENCE_TTL_MS;
  return NO_MATCH_TTL_MS;
}

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
  const expiresAt = new Date(Date.now() + resolveCacheTtlMs(value));
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
  registrableDomain?: string;
  baseRiskScore: number;
  deepScan: boolean;
  confidenceLevel?: ConfidenceLevel;
  missingReviewSignals?: boolean;
  bypassCache?: boolean;
  html?: string | null;
  companyIdentity?: CompanyIdentity | null;
  countryHint?: string | null;
}): Promise<ReputationEnrichment> {
  const normalizedDomain = normalizeDomain(input.domain);
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
      logReputationEnrichmentFromResult(input.domain, fromCache, {
        scanStage,
        enrichmentAttempted: true
      });
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
    return out;
  }

  try {
    const intel = await getPublicIntelEnrichment(normalizedDomain);
    let googleRating = intel.signals.googleScore;
    let googleReviewCount = intel.signals.googleReviewCount;
    let trustpilotRating = intel.signals.trustpilotScore;
    let trustpilotReviewCount = intel.signals.trustpilotReviewCount;
    const sourceStatus = { ...intel.signals.sourceStatus };
    let trustpilotLookup: TrustpilotLookupMeta | undefined;
    let trustpilotMatchConfidence: TrustpilotMatchConfidence | "none" = "none";
    let googleLookup: GoogleLookupMeta | undefined;
    let googleMatchConfidence: GoogleMatchConfidence | "none" = "none";

    if (outscraperEnabled && apiKeyPresent) {
      sourceStatus.outscraper.attempted = true;
      try {
        const outscraper = await fetchOutscraperReviewSignals({
          domain: normalizedDomain,
          registrableDomain: input.registrableDomain ?? normalizedDomain,
          html: input.html,
          companyIdentity: input.companyIdentity,
          countryHint: input.countryHint,
          maxTrustpilotAttempts: input.deepScan
            ? MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS
            : Math.min(3, MAX_TRUSTPILOT_OUTSCRAPER_ATTEMPTS)
        });
        sourceStatus.outscraper.ok = outscraper.ok;
        if (outscraper.googleRating != null) googleRating = outscraper.googleRating;
        if (outscraper.googleReviewCount != null) googleReviewCount = outscraper.googleReviewCount;
        if (outscraper.trustpilotRating != null) trustpilotRating = outscraper.trustpilotRating;
        if (outscraper.trustpilotReviewCount != null) trustpilotReviewCount = outscraper.trustpilotReviewCount;
        trustpilotLookup = outscraper.trustpilotLookup;
        trustpilotMatchConfidence = outscraper.trustpilotLookup.confidence;
        googleLookup = outscraper.googleLookup;
        googleMatchConfidence = outscraper.googleLookup.confidence;
        if (outscraper.error) {
          intel.signals.warnings.push(`outscraper: ${outscraper.error}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        sourceStatus.outscraper.warning = message;
        intel.signals.warnings.push(`outscraper: ${message}`);
      }
    }

    const scored = calculateReputationImpactFromPayload({ impactOnRisk: intel.impactOnRisk });
    const adjustedRisk = clampRisk(input.baseRiskScore + scored.impactOnRisk);

    const trustpilotFound =
      trustpilotMatchConfidence === "high" || trustpilotMatchConfidence === "medium"
        ? trustpilotRating != null || trustpilotReviewCount != null
        : false;
    const googleFound =
      googleMatchConfidence === "high" &&
      googleLookup?.exactDomainMatch === true &&
      googleRating != null &&
      googleReviewCount != null;
    const providerState: ReputationEnrichment["providerState"] = trustpilotFound || googleFound ? "found" : "no_match";
    const providerReason = providerState === "found" ? "Review data found." : "No matching review profile found.";
    const out: ReputationEnrichment = {
      normalizedDomain,
      signalStatus: scored.signalStatus,
      trustpilotRating,
      trustpilotReviewCount,
      googleRating,
      googleReviewCount,
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
        rating: trustpilotRating,
        reviewCount: trustpilotReviewCount
      },
      google: {
        rating: googleRating,
        reviewCount: googleReviewCount
      },
      trustpilotLookup,
      trustpilotMatchConfidence,
      googleLookup,
      googleMatchConfidence,
      publicSignals: {
        redditWarnings: intel.signals.redditWarnings,
        domainAgeDays: intel.signals.domainAgeDays,
        sslStatus: intel.signals.sslStatus,
        mailSecurity: intel.signals.mailSecurity,
        confidence: intel.signals.confidence,
        warnings: sanitizePublicIntelWarningsForUi(intel.signals.warnings),
        sourceStatus
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
    logReputationEnrichmentFromResult(input.domain, out, {
      scanStage,
      enrichmentAttempted: true
    });
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
  }
}
