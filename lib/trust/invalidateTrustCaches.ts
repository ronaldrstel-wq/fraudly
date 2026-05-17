import { revalidatePath, revalidateTag } from "next/cache";
import {
  LATEST_PUBLIC_CHECKS_CACHE_TAG,
  WEBSITE_ANALYSIS_CACHE_TAG_ALL,
  websiteAnalysisCacheTag
} from "@/lib/trust/cacheTags";

/**
 * Bust stale website analysis + public check HTML after a new public snapshot is stored.
 * Does not revalidate homepage or global marketing routes.
 */
export async function invalidateTrustCachesAfterPublicSnapshot(domain: string): Promise<void> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return;

  try {
    revalidateTag(websiteAnalysisCacheTag(normalized));
    revalidateTag(WEBSITE_ANALYSIS_CACHE_TAG_ALL);
    revalidateTag(LATEST_PUBLIC_CHECKS_CACHE_TAG);
    revalidatePath(`/check/${encodeURIComponent(normalized)}`);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[invalidateTrustCaches] revalidation skipped", { domain: normalized, err });
    }
  }
}
