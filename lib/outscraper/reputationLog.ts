import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

export function logReputationEnrichmentOutcome(args: {
  domain: string;
  normalizedDomain: string;
  scanStage: "standard" | "deep";
  enrichmentAttempted: boolean;
  cacheHit: boolean;
  providerStatus: string | null;
  apiKeyPresent: boolean;
  outscraperFeatureEnabled: boolean;
  googleRatingPresent: boolean;
  googleReviewCountPresent: boolean;
  trustpilotRatingPresent: boolean;
  trustpilotReviewCountPresent: boolean;
  skippedReason?: string | null;
  httpStatusGoogle?: number | null;
  httpStatusTrustpilot?: number | null;
}): void {
  const payload = {
    domain: args.domain,
    normalizedDomain: args.normalizedDomain,
    scanStage: args.scanStage,
    enrichmentAttempted: args.enrichmentAttempted,
    cacheHit: args.cacheHit,
    providerStatus: args.providerStatus,
    apiKeyPresent: args.apiKeyPresent,
    outscraperFeatureEnabled: args.outscraperFeatureEnabled,
    googleRatingPresent: args.googleRatingPresent,
    googleReviewCountPresent: args.googleReviewCountPresent,
    trustpilotRatingPresent: args.trustpilotRatingPresent,
    trustpilotReviewCountPresent: args.trustpilotReviewCountPresent,
    skippedReason: args.skippedReason ?? null,
    httpStatusGoogle: args.httpStatusGoogle ?? null,
    httpStatusTrustpilot: args.httpStatusTrustpilot ?? null
  };

  if (!args.apiKeyPresent && args.enrichmentAttempted) {
    console.warn("[reputation-enrichment] OUTSCRAPER_API_KEY is not set", payload);
  } else if (!args.outscraperFeatureEnabled && args.enrichmentAttempted) {
    console.warn("[reputation-enrichment] ENABLE_OUTSCRAPER_ENRICHMENT is off", payload);
  } else {
    console.info("[reputation-enrichment]", payload);
  }
}

export function logReputationEnrichmentFromResult(
  domain: string,
  enrichment: ReputationEnrichment,
  opts: { scanStage: "standard" | "deep"; enrichmentAttempted: boolean }
): void {
  logReputationEnrichmentOutcome({
    domain,
    normalizedDomain: enrichment.normalizedDomain,
    scanStage: opts.scanStage,
    enrichmentAttempted: opts.enrichmentAttempted,
    cacheHit: enrichment.cacheStatus === "hit" || enrichment.fromCache === true,
    providerStatus: enrichment.reputationStatus ?? enrichment.providerState ?? null,
    apiKeyPresent: enrichment.reputationDebug?.apiKeyPresent ?? Boolean(process.env.OUTSCRAPER_API_KEY),
    outscraperFeatureEnabled: enrichment.reputationDebug?.enabled ?? false,
    googleRatingPresent: enrichment.googleRating != null,
    googleReviewCountPresent: enrichment.googleReviewCount != null,
    trustpilotRatingPresent: enrichment.trustpilotRating != null,
    trustpilotReviewCountPresent: enrichment.trustpilotReviewCount != null,
    skippedReason: enrichment.reputationSkippedReason ?? null
  });
}
