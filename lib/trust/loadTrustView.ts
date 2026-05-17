import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import { resolveLatestPublicCheckSnapshotForCheckPage } from "@/lib/latest-public-checks/snapshot";
import {
  displayLockFromSnapshot,
  normalizeTrustResult,
  type NormalizeTrustResultOptions
} from "@/lib/trust/normalizeTrustResult";
import type { NormalizedTrustResult } from "@/lib/trust/types";
import type { ScamCheckResult } from "@/types/scam";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";

export type TrustViewForDomain = {
  result: ScamCheckResult;
  snapshot: LatestPublicCheckSnapshot | null;
  normalized: NormalizedTrustResult;
};

/**
 * Loads cached analysis + latest public snapshot and returns one normalized trust view.
 * Snapshot display lock ensures /check, /domain, and latest→detail share the same score/verdict.
 */
export type LoadTrustViewOptions = Pick<NormalizeTrustResultOptions, "enrichment"> & {
  /** When set, prefer this public snapshot id if it matches the domain (e.g. ?scanId= from latest checks). */
  preferredScanId?: string;
};

export async function loadTrustViewForDomain(
  domainLower: string,
  route: string,
  extra?: LoadTrustViewOptions
): Promise<TrustViewForDomain> {
  const preferredScanId = extra?.preferredScanId;
  const [cachedResult, snapshot] = await Promise.all([
    getCachedWebsiteAnalysis(domainLower),
    resolveLatestPublicCheckSnapshotForCheckPage(domainLower, preferredScanId)
  ]);

  const result = snapshot?.storedResult ?? cachedResult;

  if (snapshot?.storedNormalized) {
    const normalized: NormalizedTrustResult = {
      ...snapshot.storedNormalized,
      raw: result,
      scanId: snapshot.id,
      scoreSource: "public_snapshot",
      checkedAt: snapshot.lastSeenAt.toISOString()
    };
    return { result, snapshot, normalized };
  }

  const normalized = normalizeTrustResult(result, {
    displayLock: snapshot ? displayLockFromSnapshot(snapshot) : null,
    checkedAt: snapshot?.lastSeenAt ?? null,
    submittedUrl: result.redirectChain?.finalUrl ?? `https://${domainLower}`,
    route,
    ...extra
  });

  return { result, snapshot, normalized };
}
