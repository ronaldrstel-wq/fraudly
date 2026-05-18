import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import { resolveLatestPublicCheckSnapshotForCheckPage } from "@/lib/latest-public-checks/snapshot";
import { alignNormalizedTrustToCanonical } from "@/lib/trust/canonicalTrustBridge";
import {
  displayLockFromSnapshot,
  normalizeTrustResult,
  type NormalizeTrustResultOptions
} from "@/lib/trust/normalizeTrustResult";
import {
  detectRiskTrustMismatch,
  logTrustDisplayAlignment,
  payloadHasV2Schema
} from "@/lib/trust/trustDisplayLog";
import type { NormalizedTrustResult } from "@/lib/trust/types";
import type { ScamCheckResult } from "@/types/scam";
import type { LatestPublicCheckSnapshot } from "@/lib/latest-public-checks/snapshot";
import { auditTrustDisplayAlignment } from "@/lib/scoring/scoringIntegrity";

export type TrustViewForDomain = {
  result: ScamCheckResult;
  snapshot: LatestPublicCheckSnapshot | null;
  normalized: NormalizedTrustResult;
};

export type LoadTrustViewOptions = Pick<NormalizeTrustResultOptions, "enrichment"> & {
  preferredScanId?: string;
};

export async function resolveAnalysisResult(
  domainLower: string,
  snapshot: LatestPublicCheckSnapshot | null,
  preferredScanId?: string
): Promise<{ result: ScamCheckResult; resultSource: "stored-payload" | "live-cache" }> {
  void preferredScanId;
  if (snapshot?.storedResult) {
    return { result: snapshot.storedResult, resultSource: "stored-payload" };
  }
  return { result: await getCachedWebsiteAnalysis(domainLower), resultSource: "live-cache" };
}

/**
 * Loads snapshot-first analysis + normalized trust view.
 * Pinned `scanId` + stored payload avoids mixing 1h cached analysis with canonical snapshot scores.
 */
export async function loadTrustViewForDomain(
  domainLower: string,
  route: string,
  extra?: LoadTrustViewOptions
): Promise<TrustViewForDomain> {
  const preferredScanId = extra?.preferredScanId;
  const snapshot = await resolveLatestPublicCheckSnapshotForCheckPage(domainLower, preferredScanId);
  const { result, resultSource } = await resolveAnalysisResult(domainLower, snapshot, preferredScanId);

  let normalized = normalizeTrustResult(result, {
    displayLock: snapshot ? displayLockFromSnapshot(snapshot) : null,
    checkedAt: snapshot?.lastSeenAt ?? null,
    submittedUrl: result.redirectChain?.finalUrl ?? `https://${domainLower}`,
    route,
    ...extra
  });

  if (snapshot?.canonical) {
    normalized = alignNormalizedTrustToCanonical(normalized, snapshot.canonical, {
      scanId: snapshot.id,
      scoreSource: "public_snapshot"
    });
  }

  if (snapshot) {
    const canonical = snapshot.canonical;
    const drift = auditTrustDisplayAlignment({
      domain: domainLower,
      source: route,
      riskScore: canonical?.riskScore ?? snapshot.display.riskScore,
      storedStatusLabel: snapshot.statusLabel
    });
    logTrustDisplayAlignment({
      domain: domainLower,
      scanId: snapshot.id,
      riskScore: normalized.riskScore,
      trustScore: normalized.trustScore,
      consumerVerdictLabel: normalized.verdict,
      consumerVerdictBand: canonical?.consumerVerdictBand ?? null,
      statusLabel: snapshot.statusLabel,
      hasPublicPayloadV2: Boolean(snapshot.storedNormalized) || payloadHasV2Schema(null),
      source: "check-page",
      mismatchStatusLabel: drift.mismatch,
      mismatchRiskTrust: detectRiskTrustMismatch(normalized.riskScore, normalized.trustScore)
    });
    void resultSource;
  }

  return { result, snapshot, normalized };
}
