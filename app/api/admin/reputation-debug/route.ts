import { NextResponse } from "next/server";
import { isAdminRecalcAuthorized } from "@/lib/admin/adminKeyAuth";
import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import { getReputationEnrichment } from "@/lib/outscraper/reputation";
import { getReviewSignals } from "@/lib/reviewSignals";
import {
  enrichmentProviderInventory,
  resolveReputationProviders
} from "@/lib/reputation/reputationProviderResolver";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRecalcAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const domainParam = url.searchParams.get("domain")?.trim();
  if (!domainParam) {
    return NextResponse.json({ error: "domain query parameter is required" }, { status: 400 });
  }

  const normalizedDomain = normalizeDomain(domainParam);
  const inventory = enrichmentProviderInventory();

  const cacheRow = await db.reputationEnrichmentCache
    .findUnique({ where: { normalizedDomain } })
    .catch(() => null);

  const cacheHit = Boolean(cacheRow && cacheRow.expiresAt.getTime() > Date.now());
  const cacheAgeMs = cacheRow ? Date.now() - cacheRow.fetchedAt.getTime() : null;

  const baseSignals = await getReviewSignals(normalizedDomain);

  let enrichment = null;
  let enrichmentError: string | null = null;
  try {
    enrichment = await getReputationEnrichment({
      domain: normalizedDomain,
      baseRiskScore: 50,
      deepScan: true,
      bypassCache: true,
      missingReviewSignals: true
    });
  } catch (error) {
    enrichmentError = error instanceof Error ? error.message : String(error);
  }

  const resolved = resolveReputationProviders({
    domain: normalizedDomain,
    enrichment,
    baseReviewSignals: baseSignals,
    cacheRow: cacheRow
      ? {
          fetchedAt: cacheRow.fetchedAt.toISOString(),
          expiresAt: cacheRow.expiresAt.toISOString(),
          payload: (cacheRow.payload ?? {}) as unknown as import("@/lib/outscraper/reputation").ReputationEnrichment
        }
      : null
  });

  return NextResponse.json({
    domain: normalizedDomain,
    providersConfigured: inventory,
    providerCallStatus: {
      baseReviewSignals: {
        googleIndexedAttempted: baseSignals.sources.some((s) => s.toLowerCase().includes("google")),
        trustpilotPublicAttempted: baseSignals.sources.some((s) => s.toLowerCase().includes("trustpilot"))
      },
      enrichment: enrichment
        ? {
            reputationStatus: enrichment.reputationStatus,
            providerState: enrichment.providerState,
            cacheStatus: enrichment.cacheStatus,
            outscraperAttempted: enrichment.publicSignals?.sourceStatus?.outscraper?.attempted ?? false,
            outscraperOk: enrichment.publicSignals?.sourceStatus?.outscraper?.ok ?? false,
            outscraperWarning: enrichment.publicSignals?.sourceStatus?.outscraper?.warning ?? null
          }
        : null,
      enrichmentError
    },
    cache: {
      hit: cacheHit,
      ageMs: cacheAgeMs,
      expiresAt: cacheRow?.expiresAt?.toISOString() ?? null,
      status: cacheRow?.status ?? null
    },
    providers: resolved.providers.map((p) => ({
      id: p.id,
      status: p.status,
      band: p.band,
      rating: p.rating,
      reviewCount: p.reviewCount,
      usedInScore: p.usedInScore,
      displayInUi: p.displayInUi,
      reason: p.reason
    })),
    selectedDisplaySource: resolved.displaySource,
    selectedScoringSource: resolved.scoringSource,
    confidence: {
      google: resolved.google.match.confidence,
      trustpilot: resolved.trustpilot.match.confidence,
      hiddenReasons: resolved.hiddenReasons,
      hasConflictingProviders: resolved.hasConflictingProviders
    },
    displayChannels: {
      google: {
        displayState: resolved.google.display.displayState,
        showMetrics: resolved.google.display.showMetrics,
        usedInTrustScore: resolved.google.display.usedInTrustScore,
        label: `${"Google Reviews"} · ${resolved.google.display.displayState}`
      },
      trustpilot: {
        displayState: resolved.trustpilot.display.displayState,
        showMetrics: resolved.trustpilot.display.showMetrics,
        usedInTrustScore: resolved.trustpilot.display.usedInTrustScore
      }
    },
    normalizedEnrichment: enrichment
      ? {
          googleRating: enrichment.googleRating,
          googleReviewCount: enrichment.googleReviewCount,
          googleMatchConfidence: enrichment.googleMatchConfidence,
          googleLookup: enrichment.googleLookup,
          trustpilotRating: enrichment.trustpilotRating,
          trustpilotReviewCount: enrichment.trustpilotReviewCount,
          trustpilotMatchConfidence: enrichment.trustpilotMatchConfidence,
          trustpilotLookup: enrichment.trustpilotLookup,
          providerState: enrichment.providerState,
          providerReason: enrichment.providerReason
        }
      : null
  });
}
