import { unstable_cache } from "next/cache";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";

const REVALIDATE_SECONDS = 3600;

/** Cache key segments; serialized function args differentiate domains. */
const getCachedWebsiteAnalysisInner = unstable_cache(
  async (domainLower: string) => runWebsiteAnalysis(`https://${domainLower}`, "en"),
  ["website-analysis-v2-intel"],
  { revalidate: REVALIDATE_SECONDS }
);

/**
 * Cached per-domain analysis for SEO/shareable `/check/[domain]` pages.
 */
export function getCachedWebsiteAnalysis(domainLower: string) {
  return getCachedWebsiteAnalysisInner(domainLower.toLowerCase());
}
