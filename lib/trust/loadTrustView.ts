import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import { getLatestPublicCheckSnapshotForDomain } from "@/lib/latest-public-checks/snapshot";
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
export async function loadTrustViewForDomain(
  domainLower: string,
  route: string,
  extra?: Pick<NormalizeTrustResultOptions, "enrichment">
): Promise<TrustViewForDomain> {
  const [result, snapshot] = await Promise.all([
    getCachedWebsiteAnalysis(domainLower),
    getLatestPublicCheckSnapshotForDomain(domainLower)
  ]);

  const normalized = normalizeTrustResult(result, {
    displayLock: snapshot ? displayLockFromSnapshot(snapshot) : null,
    checkedAt: snapshot?.lastSeenAt ?? null,
    submittedUrl: result.redirectChain?.finalUrl ?? `https://${domainLower}`,
    route,
    ...extra
  });

  return { result, snapshot, normalized };
}
