import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  alignNormalizedTrustToCanonical,
  buildCanonicalTrustFieldsFromResult,
  buildNormalizedTrustFromLegacyResult,
  buildPublicResultPayloadV2,
  parsePublicResultPayload,
  PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION
} from "@/lib/trust/canonicalTrustBridge";
import { normalizeRiskScore } from "@/lib/scoring/displayScore";
import type { Prisma } from "@prisma/client";

export type BackfillRowInput = {
  id: string;
  normalizedValue: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPayload: unknown;
  consumerVerdict?: string | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  normalizedTrustScore?: number | null;
  normalizedRiskScore?: number | null;
};

export type BackfillRowPlan = {
  id: string;
  domain: string;
  update: {
    consumerVerdict: string | null;
    consumerVerdictLabel: string;
    consumerVerdictBand: string;
    normalizedTrustScore: number;
    normalizedRiskScore: number;
    publicResultPayload: Prisma.InputJsonValue;
    riskScoreSnapshot?: number;
  } | null;
  skipReason?: string;
};

export type BackfillSummary = {
  dryRun: boolean;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  failureExamples: Array<{ id: string; domain: string; reason: string }>;
};

export function planBackfillRow(row: BackfillRowInput): BackfillRowPlan {
  const domain = row.normalizedValue;
  const parsed = row.publicResultPayload
    ? parsePublicResultPayload(row.publicResultPayload, domain)
    : null;

  if (!parsed?.result) {
    const risk = normalizeRiskScore(row.riskScoreSnapshot);
    if (!Number.isFinite(risk)) {
      return { id: row.id, domain, update: null, skipReason: "invalid_risk_snapshot" };
    }
    return { id: row.id, domain, update: null, skipReason: "no_parseable_payload" };
  }

  const result = parsed.result;
  if (normalizeDomain(result.domain) !== normalizeDomain(domain)) {
    return { id: row.id, domain, update: null, skipReason: "domain_mismatch" };
  }

  const canonical =
    parsed.canonical ??
    buildCanonicalTrustFieldsFromResult(result);

  const alignedRisk = normalizeRiskScore(row.riskScoreSnapshot);
  if (alignedRisk !== canonical.riskScore) {
    canonical.riskScore = alignedRisk;
    canonical.trustScore = Math.max(0, Math.min(100, 100 - alignedRisk));
  }

  const normalized = alignNormalizedTrustToCanonical(
    parsed.normalizedTrustResult ??
      buildNormalizedTrustFromLegacyResult(result, { route: "backfill/latest-public-check" }),
    canonical,
    { scoreSource: "public_snapshot" }
  );

  const payload = buildPublicResultPayloadV2(result, normalized, canonical);

  const alreadyComplete =
    row.normalizedTrustScore === canonical.trustScore &&
    row.normalizedRiskScore === canonical.riskScore &&
    row.consumerVerdictLabel === canonical.consumerVerdictLabel &&
    row.consumerVerdictBand === canonical.consumerVerdictBand &&
    row.publicResultPayload &&
    typeof row.publicResultPayload === "object" &&
    (row.publicResultPayload as { schemaVersion?: number }).schemaVersion ===
      PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION;

  if (alreadyComplete) {
    return { id: row.id, domain, update: null, skipReason: "already_canonical" };
  }

  return {
    id: row.id,
    domain,
    update: {
      consumerVerdict: canonical.consumerVerdict,
      consumerVerdictLabel: canonical.consumerVerdictLabel,
      consumerVerdictBand: canonical.consumerVerdictBand,
      normalizedTrustScore: canonical.trustScore,
      normalizedRiskScore: canonical.riskScore,
      publicResultPayload: payload as unknown as Prisma.InputJsonValue,
      ...(alignedRisk !== row.riskScoreSnapshot ? { riskScoreSnapshot: alignedRisk } : {})
    }
  };
}

export async function backfillLatestPublicCheckCanonicalTrust(options: {
  dryRun: boolean;
  batchSize: number;
  maxRows?: number;
}): Promise<BackfillSummary> {
  const summary: BackfillSummary = {
    dryRun: options.dryRun,
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    failureExamples: []
  };

  let cursor: string | undefined;
  const maxRows = options.maxRows ?? Number.POSITIVE_INFINITY;

  while (summary.processed < maxRows) {
    const take = Math.min(options.batchSize, maxRows - summary.processed);
    const rows = await db.latestPublicCheck.findMany({
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        normalizedValue: true,
        riskScoreSnapshot: true,
        statusLabel: true,
        publicResultPayload: true,
        consumerVerdict: true,
        consumerVerdictLabel: true,
        consumerVerdictBand: true,
        normalizedTrustScore: true,
        normalizedRiskScore: true
      } as const
    });

    if (rows.length === 0) break;

    for (const row of rows) {
      summary.processed += 1;
      try {
        const plan = planBackfillRow(row);
        if (!plan.update) {
          summary.skipped += 1;
          continue;
        }
        if (!options.dryRun) {
          await db.latestPublicCheck.update({
            where: { id: row.id },
            data: plan.update
          });
        }
        summary.updated += 1;
      } catch (err) {
        summary.failed += 1;
        if (summary.failureExamples.length < 5) {
          summary.failureExamples.push({
            id: row.id,
            domain: row.normalizedValue,
            reason: err instanceof Error ? err.message : String(err)
          });
        }
      }
    }

    cursor = rows[rows.length - 1]?.id;
    if (rows.length < take) break;
  }

  return summary;
}
