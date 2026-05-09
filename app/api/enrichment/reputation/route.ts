import { NextResponse } from "next/server";
import { DailyInMemoryRateLimiter, getClientIp } from "@/lib/rateLimiter";
import { getReputationEnrichment } from "@/lib/outscraper/reputation";

export const runtime = "nodejs";

const enrichmentLimiter = new DailyInMemoryRateLimiter(process.env.NODE_ENV === "development" ? 60 : 20);

type Body = {
  domain?: string;
  baseRiskScore?: number;
  deepScan?: boolean;
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

  console.info("[enrichment/reputation] route called", {
    deepScan,
    hasDomain: Boolean(domain),
    publicIntelEnabled: process.env.ENABLE_PUBLIC_INTEL_ENRICHMENT !== "false"
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
    deepScan
  });

  console.info("[enrichment/reputation] response summary", {
    normalizedDomain: enrichment.normalizedDomain,
    source: enrichment.source,
    trustpilotRating: enrichment.trustpilotRating,
    trustpilotReviewCount: enrichment.trustpilotReviewCount,
    googleRating: enrichment.googleRating,
    googleReviewCount: enrichment.googleReviewCount
  });

  return NextResponse.json({ enrichment });
}

