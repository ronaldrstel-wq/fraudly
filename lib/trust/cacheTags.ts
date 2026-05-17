/** Shared Next.js cache tags (no server-only imports). */

export const WEBSITE_ANALYSIS_CACHE_TAG_ALL = "website-analysis-v3";

export function websiteAnalysisCacheTag(domainLower: string): string {
  return `${WEBSITE_ANALYSIS_CACHE_TAG_ALL}:${domainLower.toLowerCase()}`;
}

export const LATEST_PUBLIC_CHECKS_CACHE_TAG = "latest-public-checks-feed";
