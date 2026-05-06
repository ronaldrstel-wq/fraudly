import { normalizeDomain } from "@/lib/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const ENRICHMENT_PROVIDER = "outscraper";
const STABLE_TTL_DAYS = 30;
const MISS_TTL_DAYS = 7;

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
  source: "outscraper" | "cache" | "none";
  trustpilot?: { rating: number | null; reviewCount: number | null };
  google?: { rating: number | null; reviewCount: number | null };
  message?: string;
}

type OutscraperPayload = {
  trustpilotRating: number | null;
  trustpilotReviewCount: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  latestReviewDate: string | null;
  sentimentSummary: string | null;
  businessName: string | null;
  businessNameMatch: boolean | null;
  reviewSpikeSuspected: boolean;
};

function clampRisk(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function rootLabel(domain: string): string {
  const parts = domain.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts[0] ?? domain.toLowerCase();
  return parts[parts.length - 2] ?? domain.toLowerCase();
}

function inferBusinessNameMatch(domain: string, businessName: string | null): boolean | null {
  if (!businessName) return null;
  const d = rootLabel(domain);
  const b = businessName.toLowerCase();
  return b.includes(d);
}

export function calculateReputationImpactFromPayload(payload: OutscraperPayload): {
  impactOnRisk: number;
  signalStatus: ReputationSignalStatus;
} {
  let impact = 0;
  let positives = 0;
  let negatives = 0;
  const weightedChecks = [
    { rating: payload.trustpilotRating, count: payload.trustpilotReviewCount },
    { rating: payload.googleRating, count: payload.googleReviewCount }
  ];

  for (const check of weightedChecks) {
    if (check.rating == null || check.count == null) continue;
    if (check.rating >= 4.0 && check.count >= 100) {
      impact -= 6;
      positives += 1;
    } else if (check.rating <= 2.8 && check.count >= 20) {
      impact += 7;
      negatives += 1;
    } else if (check.rating <= 3.4 && check.count >= 10) {
      impact += 4;
      negatives += 1;
    }
  }

  if (payload.latestReviewDate) {
    const ageDays = Math.floor((Date.now() - new Date(payload.latestReviewDate).getTime()) / (1000 * 60 * 60 * 24));
    if (Number.isFinite(ageDays) && ageDays > 365) {
      impact -= 2;
      positives += 1;
    }
  }

  if (payload.businessNameMatch === false) {
    impact += 4;
    negatives += 1;
  } else if (payload.businessNameMatch === true) {
    impact -= 2;
    positives += 1;
  }

  if (payload.reviewSpikeSuspected) {
    impact += 4;
    negatives += 1;
  }

  impact = Math.max(-15, Math.min(15, impact));

  if (payload.trustpilotRating == null && payload.googleRating == null) {
    return { impactOnRisk: 0, signalStatus: "Missing" };
  }
  if (negatives >= 2 || impact >= 7) return { impactOnRisk: impact, signalStatus: "Weak" };
  if (positives >= 2 && impact <= -6) return { impactOnRisk: impact, signalStatus: "Positive" };
  return { impactOnRisk: impact, signalStatus: "Mixed" };
}

function shouldCallOutscraper(args: { baseRiskScore: number; deepScan: boolean }) {
  if (args.deepScan) return true;
  return args.baseRiskScore >= 40 && args.baseRiskScore <= 80;
}

export function shouldTriggerOutscraper(args: { baseRiskScore: number; deepScan: boolean }) {
  return shouldCallOutscraper(args);
}

function toResponse(domain: string, baseRiskScore: number, payload: OutscraperPayload, source: "outscraper" | "cache"): ReputationEnrichment {
  const scored = calculateReputationImpactFromPayload(payload);
  const adjustedRisk = clampRisk(baseRiskScore + scored.impactOnRisk);
  return {
    normalizedDomain: domain,
    signalStatus: scored.signalStatus,
    trustpilotRating: payload.trustpilotRating,
    trustpilotReviewCount: payload.trustpilotReviewCount,
    googleRating: payload.googleRating,
    googleReviewCount: payload.googleReviewCount,
    latestReviewDate: payload.latestReviewDate,
    sentimentSummary: payload.sentimentSummary,
    businessName: payload.businessName,
    businessNameMatch: payload.businessNameMatch,
    reviewSpikeSuspected: payload.reviewSpikeSuspected,
    impactOnRisk: scored.impactOnRisk,
    adjustedRiskScore: adjustedRisk,
    adjustedTrustScore: 100 - adjustedRisk,
    lastUpdated: new Date().toISOString(),
    fromCache: source === "cache",
    source,
    trustpilot: {
      rating: payload.trustpilotRating,
      reviewCount: payload.trustpilotReviewCount
    },
    google: {
      rating: payload.googleRating,
      reviewCount: payload.googleReviewCount
    }
  };
}

async function fetchOutscraperAggregates(domain: string, apiKey: string): Promise<OutscraperPayload> {
  const url = `https://api.app.outscraper.com/google/maps/search-v3?query=${encodeURIComponent(domain)}&limit=1`;
  const response = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Outscraper request failed (${response.status})`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  const rows = Array.isArray(json?.data) ? (json.data as Array<Record<string, unknown>>) : [];
  const first = rows[0] ?? {};

  const businessName = typeof first.name === "string" ? first.name : null;
  const googleRating = typeof first.rating === "number" ? first.rating : null;
  const googleReviewCount = typeof first.reviews === "number" ? first.reviews : null;

  // Trustpilot fields may be unavailable in this endpoint; keep nullable and non-blocking.
  const trustpilotRating =
    typeof first.trustpilot_rating === "number" ? first.trustpilot_rating : null;
  const trustpilotReviewCount =
    typeof first.trustpilot_reviews === "number" ? first.trustpilot_reviews : null;
  const latestReviewDate =
    typeof first.latest_review_date === "string" ? first.latest_review_date : null;
  const sentimentSummary =
    typeof first.review_sentiment_summary === "string" ? first.review_sentiment_summary : null;
  const reviewSpikeSuspected = typeof first.review_spike === "boolean" ? first.review_spike : false;

  console.info("[outscraper] parsed provider payload", {
    normalizedDomain: domain,
    trustpilotRating,
    trustpilotReviewCount,
    googleRating,
    googleReviewCount
  });

  return {
    trustpilotRating,
    trustpilotReviewCount,
    googleRating,
    googleReviewCount,
    latestReviewDate,
    sentimentSummary,
    businessName,
    businessNameMatch: inferBusinessNameMatch(domain, businessName),
    reviewSpikeSuspected
  };
}

export async function getReputationEnrichment(input: {
  domain: string;
  baseRiskScore: number;
  deepScan: boolean;
}): Promise<ReputationEnrichment> {
  const normalizedDomain = normalizeDomain(input.domain);
  const now = new Date();
  console.info("[outscraper] enrichment start", {
    normalizedDomain,
    deepScan: input.deepScan,
    baseRiskScore: input.baseRiskScore
  });

  if (process.env.ENABLE_OUTSCRAPER_ENRICHMENT !== "true") {
    return {
      normalizedDomain,
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
      adjustedRiskScore: clampRisk(input.baseRiskScore),
      adjustedTrustScore: 100 - clampRisk(input.baseRiskScore),
      lastUpdated: now.toISOString(),
      fromCache: false,
      source: "none",
      message: "External reputation enrichment is disabled."
    };
  }

  const cached = await db.reputationEnrichmentCache.findUnique({ where: { normalizedDomain } });
  if (cached && cached.expiresAt > now && cached.payload) {
    console.info("[outscraper] cache hit", { domain: normalizedDomain });
    return {
      ...(cached.payload as unknown as ReputationEnrichment),
      fromCache: true,
      source: "cache"
    };
  }
  console.info("[outscraper] cache miss", { domain: normalizedDomain });

  if (!shouldCallOutscraper({ baseRiskScore: input.baseRiskScore, deepScan: input.deepScan })) {
    return {
      normalizedDomain,
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
      adjustedRiskScore: clampRisk(input.baseRiskScore),
      adjustedTrustScore: 100 - clampRisk(input.baseRiskScore),
      lastUpdated: now.toISOString(),
      fromCache: false,
      source: "none",
      message: "Skipped external lookup; base scan confidence is sufficient."
    };
  }

  const key = process.env.OUTSCRAPER_API_KEY?.trim();
  if (!key) {
    return {
      normalizedDomain,
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
      adjustedRiskScore: clampRisk(input.baseRiskScore),
      adjustedTrustScore: 100 - clampRisk(input.baseRiskScore),
      lastUpdated: now.toISOString(),
      fromCache: false,
      source: "none",
      message: "Outscraper API key is missing."
    };
  }

  try {
    const payload = await fetchOutscraperAggregates(normalizedDomain, key);
    const response = toResponse(normalizedDomain, input.baseRiskScore, payload, "outscraper");
    const expiresAt = new Date(now.getTime() + STABLE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const estimatedCostUsd = 0.01;

    await db.reputationEnrichmentCache.upsert({
      where: { normalizedDomain },
      create: {
        normalizedDomain,
        provider: ENRICHMENT_PROVIDER,
        status: "ok",
        payload: response as unknown as Prisma.InputJsonValue,
        fetchError: null,
        estimatedCostUsd,
        fetchedAt: now,
        expiresAt
      },
      update: {
        status: "ok",
        payload: response as unknown as Prisma.InputJsonValue,
        fetchError: null,
        estimatedCostUsd,
        fetchedAt: now,
        expiresAt
      }
    });

    console.info("[outscraper] provider call", { domain: normalizedDomain, estimatedCostUsd });
    return response;
  } catch (error) {
    const expiresAt = new Date(now.getTime() + MISS_TTL_DAYS * 24 * 60 * 60 * 1000);
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.reputationEnrichmentCache.upsert({
      where: { normalizedDomain },
      create: {
        normalizedDomain,
        provider: ENRICHMENT_PROVIDER,
        status: "failed",
        payload: Prisma.JsonNull,
        fetchError: message,
        estimatedCostUsd: 0,
        fetchedAt: now,
        expiresAt
      },
      update: {
        status: "failed",
        payload: Prisma.JsonNull,
        fetchError: message,
        estimatedCostUsd: 0,
        fetchedAt: now,
        expiresAt
      }
    });
    console.warn("[outscraper] provider failure", { domain: normalizedDomain, message });
    return {
      normalizedDomain,
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
      adjustedRiskScore: clampRisk(input.baseRiskScore),
      adjustedTrustScore: 100 - clampRisk(input.baseRiskScore),
      lastUpdated: now.toISOString(),
      fromCache: false,
      source: "none",
      message: "External reputation lookup failed. Showing base scan only."
    };
  }
}

