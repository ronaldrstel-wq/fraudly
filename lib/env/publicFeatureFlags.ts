import { publicIntelConfig } from "@/lib/public-intel/config";

/** Non-secret feature flags relevant to public scan persistence and latest checks. */
export function getPublicFeatureFlagsSnapshot(): Record<string, boolean | string> {
  return {
    ENABLE_PUBLIC_INTEL_ENRICHMENT: publicIntelConfig.enrichmentEnabled,
    ENABLE_PUBLIC_INTEL_GOOGLE_INDEXED_REVIEWS: publicIntelConfig.publicSources.googleIndexedReviews,
    ENABLE_PUBLIC_INTEL_TRUSTPILOT: publicIntelConfig.publicSources.trustpilot,
    ENABLE_OUTSCRAPER_ENRICHMENT: publicIntelConfig.paidSources.outscraper,
    OUTSCRAPER_API_KEY_PRESENT: Boolean(process.env.OUTSCRAPER_API_KEY?.trim()),
    ENABLE_GOOGLE_PLACES_REVIEWS: publicIntelConfig.paidSources.googlePlacesReviews,
    ENABLE_TRUSTPILOT_PRIVATE_API: publicIntelConfig.paidSources.trustpilotPrivateApi,
    LATEST_CHECKS_BYPASS_CACHE:
      process.env.LATEST_CHECKS_BYPASS_CACHE?.trim().toLowerCase() === "true",
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "unset"
  };
}
