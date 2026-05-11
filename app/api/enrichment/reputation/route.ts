import { NextResponse } from "next/server";
import { DailyInMemoryRateLimiter, getClientIp } from "@/lib/rateLimiter";
import { getReputationEnrichment } from "@/lib/outscraper/reputation";

export const runtime = "nodejs";

const enrichmentLimiter = new DailyInMemoryRateLimiter(process.env.NODE_ENV === "development" ? 60 : 20);

type Body = {
  domain?: string;
  baseRiskScore?: number;
  deepScan?: boolean;
  confidenceLevel?: "high" | "medium" | "low";
  missingReviewSignals?: boolean;
  bypassCache?: boolean;
  forceReputationRefresh?: boolean;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const domain = typeof body.domain === "string" ? body.domain.trim() : "";
  const baseRiskScore = typeof body.baseRiskScore === "number" ? body.baseRiskScore : 50;
  const deepScan = body.deepScan === true;
  const confidenceLevel = body.confidenceLevel === "low" || body.confidenceLevel === "high" ? body.confidenceLevel : "medium";
  const missingReviewSignals = body.missingReviewSignals === true;
  const forceReputationRefresh = body.forceReputationRefresh === true;
  const scanStage = deepScan ? "deep" : "standard";
  const bypassCache =
    deepScan === true || (process.env.NODE_ENV !== "production" && (body.bypassCache === true || forceReputationRefresh));

  console.info("[enrichment/reputation] route called", {
    domain,
    scanStage,
    deepScan,
    hasDomain: Boolean(domain),
    publicIntelEnabled: process.env.ENABLE_PUBLIC_INTEL_ENRICHMENT !== "false",
    outscraperEnabled: process.env.ENABLE_OUTSCRAPER_ENRICHMENT === "true",
    hasOutscraperKey: Boolean(process.env.OUTSCRAPER_API_KEY),
    confidenceLevel,
    missingReviewSignals,
    bypassCache,
    forceReputationRefresh
  });

  if (!domain) {
    return NextResponse.json({ error: "domain_required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limit = enrichmentLimiter.consume(`public-intel:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const enrichment = await getReputationEnrichment({
    domain,
    baseRiskScore,
    deepScan,
    confidenceLevel,
    missingReviewSignals,
    bypassCache
  });

  console.info("[enrichment/reputation] response summary", {
    scanStage,
    normalizedDomain: enrichment.normalizedDomain,
    source: enrichment.source,
    trustpilotRating: enrichment.trustpilotRating,
    trustpilotReviewCount: enrichment.trustpilotReviewCount,
    googleRating: enrichment.googleRating,
    googleReviewCount: enrichment.googleReviewCount,
    providerState: enrichment.providerState,
    providerReason: enrichment.providerReason,
    cacheStatus: enrichment.cacheStatus,
    fromCache: enrichment.fromCache,
    reputationStatus: enrichment.reputationStatus,
    reputationScanStage: enrichment.reputationScanStage,
    reputationSkippedReason: enrichment.reputationSkippedReason,
    reputationDebug: enrichment.reputationDebug
  });

  return NextResponse.json({ enrichment });
}

