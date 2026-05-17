import { checkResultHref } from "@/lib/check/checkResultHref";
import { db } from "@/lib/db";
import { classifyWebsiteCheckForPublication } from "@/lib/latest-public-checks/filter";
import { publicStatusLabelForVerdict } from "@/lib/latest-public-checks/status-label";
import { enrichScamCheckResultDomainAge } from "@/lib/domain/normalizeDomainAge";
import { normalizeRiskScore } from "@/lib/scoring/displayScore";
import {
  alignNormalizedTrustToCanonical,
  buildCanonicalTrustFieldsFromResult,
  buildNormalizedTrustFromLegacyResult,
  buildPublicResultPayloadV2
} from "@/lib/trust/canonicalTrustBridge";
import { invalidateTrustCachesAfterPublicSnapshot } from "@/lib/trust/invalidateTrustCaches";
import {
  detectRiskTrustMismatch,
  logTrustDisplayAlignment,
  payloadHasV2Schema
} from "@/lib/trust/trustDisplayLog";
import { auditTrustDisplayAlignment } from "@/lib/scoring/scoringIntegrity";
import type { ScamCheckResult } from "@/types/scam";
import { Prisma } from "@prisma/client";

/** Fire-and-forget–safe caller should catch errors; never attaches user/session ids. */
export async function upsertLatestPublicCheckFromCompletedScan(options: {
  parsedUrl: URL;
  originalInput: string;
  result: ScamCheckResult;
}): Promise<void> {
  const gate = classifyWebsiteCheckForPublication(options.parsedUrl, options.originalInput);
  if (!gate.publish) return;

  const result = enrichScamCheckResultDomainAge(options.result);
  const domain = result.domain;
  const canonical = buildCanonicalTrustFieldsFromResult(result);
  const risk = canonical.riskScore;
  const statusLabel = publicStatusLabelForVerdict(result.verdict);
  const normalized = alignNormalizedTrustToCanonical(
    buildNormalizedTrustFromLegacyResult(result, { route: "persist/latest-public-check" }),
    canonical,
    { scoreSource: "public_snapshot" }
  );
  const payload = buildPublicResultPayloadV2(result, normalized, canonical) as unknown as Prisma.InputJsonValue;

  const baseData = {
    checkedValue: gate.checkedValueForDisplay.slice(0, 4096),
    entityType: gate.entityType,
    riskScoreSnapshot: risk,
    statusLabel,
    consumerVerdict: canonical.consumerVerdict,
    consumerVerdictLabel: canonical.consumerVerdictLabel,
    consumerVerdictBand: canonical.consumerVerdictBand,
    normalizedTrustScore: canonical.trustScore,
    normalizedRiskScore: canonical.riskScore
  };

  let row: { id: string };
  try {
    row = await db.latestPublicCheck.upsert({
      where: { normalizedValue: gate.normalizedValue },
      create: {
        normalizedValue: gate.normalizedValue,
        ...baseData,
        publicResultPath: `/check/${encodeURIComponent(domain)}`,
        publicResultPayload: payload
      },
      update: { ...baseData, publicResultPayload: payload },
      select: { id: true }
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) throw err;
    row = await db.latestPublicCheck.upsert({
      where: { normalizedValue: gate.normalizedValue },
      create: {
        normalizedValue: gate.normalizedValue,
        checkedValue: baseData.checkedValue,
        entityType: baseData.entityType,
        riskScoreSnapshot: baseData.riskScoreSnapshot,
        statusLabel: baseData.statusLabel,
        publicResultPath: `/check/${encodeURIComponent(domain)}`
      },
      update: {
        checkedValue: baseData.checkedValue,
        entityType: baseData.entityType,
        riskScoreSnapshot: baseData.riskScoreSnapshot,
        statusLabel: baseData.statusLabel
      },
      select: { id: true }
    });
  }

  try {
    const publicResultPath = checkResultHref(domain, { scanId: row.id, from: "latest-card" });
    await db.latestPublicCheck.update({
      where: { id: row.id },
      data: { publicResultPath }
    });
  } catch {
    // Non-fatal if path update fails
  }

  const drift = auditTrustDisplayAlignment({
    domain,
    source: "persist/latest-public-check",
    riskScore: canonical.riskScore,
    storedStatusLabel: statusLabel
  });

  logTrustDisplayAlignment({
    domain,
    scanId: row.id,
    riskScore: canonical.riskScore,
    trustScore: canonical.trustScore,
    consumerVerdictLabel: canonical.consumerVerdictLabel,
    consumerVerdictBand: canonical.consumerVerdictBand,
    statusLabel,
    hasPublicPayloadV2: payloadHasV2Schema(payload),
    source: "persist",
    mismatchStatusLabel: drift.mismatch,
    mismatchRiskTrust: detectRiskTrustMismatch(canonical.riskScore, canonical.trustScore)
  });

  await invalidateTrustCachesAfterPublicSnapshot(domain);
}
