import { unstable_cache } from "next/cache";
import { runWebsiteAnalysis } from "@/lib/analysis/runWebsiteAnalysis";
import { db } from "@/lib/db";
import { applyDomainOverrideToResult } from "@/lib/admin/apply-domain-override";
import { enrichScamCheckResultDomainAge } from "@/lib/domain/normalizeDomainAge";

const REVALIDATE_SECONDS = 3600;

import {
  WEBSITE_ANALYSIS_CACHE_TAG_ALL,
  websiteAnalysisCacheTag
} from "@/lib/trust/cacheTags";

export { WEBSITE_ANALYSIS_CACHE_TAG_ALL, websiteAnalysisCacheTag } from "@/lib/trust/cacheTags";

async function runAnalysisForDomain(domainLower: string) {
  const normalized = domainLower.toLowerCase();
  const base = await runWebsiteAnalysis(`https://${normalized}`, "en", { scanKind: "full" });
  const override = await db.domainAdminOverride.findUnique({ where: { domain: normalized } });
  return enrichScamCheckResultDomainAge(applyDomainOverrideToResult(base, override));
}

/**
 * Cached per-domain analysis for SEO/shareable `/check/[domain]` pages.
 * Per-domain cache keys + tags allow targeted invalidation after public snapshot persist.
 */
export function getCachedWebsiteAnalysis(domainLower: string) {
  const normalized = domainLower.toLowerCase();
  return unstable_cache(
    () => runAnalysisForDomain(normalized),
    ["website-analysis-v4-full-scan", normalized],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [WEBSITE_ANALYSIS_CACHE_TAG_ALL, websiteAnalysisCacheTag(normalized)]
    }
  )();
}
