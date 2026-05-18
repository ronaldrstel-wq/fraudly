import { revalidatePath, revalidateTag } from "next/cache";
import { LOCALIZED_LOCALES } from "@/lib/i18n/locales";
import {
  LATEST_PUBLIC_CHECKS_CACHE_TAG,
  websiteAnalysisCacheTag,
  WEBSITE_ANALYSIS_CACHE_TAG_ALL
} from "@/lib/trust/cacheTags";

const MAX_PAGINATED_LATEST_CHECKS_PAGES = 20;

export type InvalidateLatestPublicChecksCachesResult = {
  tag: string;
  paths: string[];
  domainPaths: string[];
};

function latestChecksPathsToRevalidate(): string[] {
  const paths = new Set<string>(["/", "/latest-checks"]);

  for (const locale of LOCALIZED_LOCALES) {
    paths.add(`/${locale}`);
    paths.add(`/${locale}/latest-checks`);
  }

  for (let page = 2; page <= MAX_PAGINATED_LATEST_CHECKS_PAGES; page += 1) {
    paths.add(`/latest-checks?page=${page}`);
    for (const locale of LOCALIZED_LOCALES) {
      paths.add(`/${locale}/latest-checks?page=${page}`);
    }
  }

  return [...paths];
}

/**
 * Bust latest-checks list `unstable_cache` entries and ISR pages after DB backfill or moderation.
 */
export function invalidateLatestPublicChecksCaches(options?: {
  domains?: string[];
}): InvalidateLatestPublicChecksCachesResult {
  const paths = latestChecksPathsToRevalidate();
  const domainPaths: string[] = [];

  try {
    revalidateTag(LATEST_PUBLIC_CHECKS_CACHE_TAG);
    for (const path of paths) {
      revalidatePath(path);
    }

    const seenDomains = new Set<string>();
    for (const raw of options?.domains ?? []) {
      const domain = raw.trim().toLowerCase();
      if (!domain || seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      const checkPath = `/check/${encodeURIComponent(domain)}`;
      domainPaths.push(checkPath);
      revalidatePath(checkPath);
      revalidateTag(websiteAnalysisCacheTag(domain));
    }
    if (domainPaths.length > 0) {
      revalidateTag(WEBSITE_ANALYSIS_CACHE_TAG_ALL);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[invalidateLatestPublicChecksCaches] revalidation skipped", {
        err: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return {
    tag: LATEST_PUBLIC_CHECKS_CACHE_TAG,
    paths,
    domainPaths
  };
}
