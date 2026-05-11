import { unstable_cache } from "next/cache";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { db } from "@/lib/db";
import { applyDomainOverrideToResult } from "@/lib/admin/apply-domain-override";

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
  return (async () => {
    const normalized = domainLower.toLowerCase();
    const base = await getCachedWebsiteAnalysisInner(normalized);
    const override = await db.domainAdminOverride.findUnique({ where: { domain: normalized } });
    return applyDomainOverrideToResult(base, override);
  })();
}
