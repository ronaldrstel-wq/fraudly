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

  if (!domain) {
    return NextResponse.json({ error: "domain_required" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const limit = enrichmentLimiter.consume(`outscraper:${ip}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const enrichment = await getReputationEnrichment({
    domain,
    baseRiskScore,
    deepScan
  });

  return NextResponse.json({ enrichment });
}

