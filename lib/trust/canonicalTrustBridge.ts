import { normalizeDomain } from "@/lib/cache";
import { scamVerdictFromConsumerLabel } from "@/lib/scoring/consumerVerdictMap";
import {
  consumerDisplayBand,
  getTrustBandFromScore,
  standardVerdictLabel,
  type ConsumerVerdictLabel,
  type TrustBandId
} from "@/lib/scoring/trust-bands";
import { normalizeRiskScore, trustScoreFromRisk } from "@/lib/scoring/displayScore";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import { normalizeTrustResult } from "@/lib/trust/normalizeTrustResult";
import type { NormalizedTrustResult } from "@/lib/trust/types";
import type { ConfidenceLevel } from "@/types/site-outcome";
import type { ScamCheckResult, ScamVerdict } from "@/types/scam";

export const PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION = 2 as const;

export type CanonicalTrustFields = {
  trustScore: number;
  riskScore: number;
  /** Legacy 3-tier API verdict derived from consumer label. */
  consumerVerdict: ScamVerdict | null;
  consumerVerdictLabel: ConsumerVerdictLabel;
  consumerVerdictBand: TrustBandId;
  scoreConfidence: ConfidenceLevel;
};

export type SerializedNormalizedTrustResult = Omit<NormalizedTrustResult, "raw">;

export type PublicResultPayloadV2 = {
  schemaVersion: typeof PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION;
  result: ScamCheckResult;
  normalizedTrustResult: SerializedNormalizedTrustResult;
  canonical: CanonicalTrustFields;
};

export type ParsedPublicResultPayload = {
  result: ScamCheckResult;
  normalizedTrustResult: NormalizedTrustResult | null;
  canonical: CanonicalTrustFields | null;
  schemaVersion: 1 | 2;
};

export function serializeNormalizedTrustResult(
  normalized: NormalizedTrustResult
): SerializedNormalizedTrustResult {
  const { raw: _raw, ...rest } = normalized;
  return rest;
}

export function attachRawToNormalized(
  serialized: SerializedNormalizedTrustResult,
  raw: ScamCheckResult
): NormalizedTrustResult {
  return { ...serialized, raw };
}

/** Canonical display fields from a completed scan (live analysis, no snapshot lock). */
export function buildCanonicalTrustFieldsFromResult(result: ScamCheckResult): CanonicalTrustFields {
  const riskScore = normalizeRiskScore(result.score);
  const trustScore = displayTrustScoreForResult(result) ?? trustScoreFromRisk(riskScore);
  const consumerVerdictLabel = standardVerdictLabel(trustScore) as ConsumerVerdictLabel;
  return {
    trustScore,
    riskScore,
    consumerVerdict: scamVerdictFromConsumerLabel(consumerVerdictLabel),
    consumerVerdictLabel,
    consumerVerdictBand: getTrustBandFromScore(trustScore),
    scoreConfidence: result.confidenceLevel ?? "medium"
  };
}

export function buildCanonicalTrustFieldsFromNormalized(
  normalized: Pick<NormalizedTrustResult, "trustScore" | "riskScore" | "verdict">,
  result: Pick<ScamCheckResult, "confidenceLevel">
): CanonicalTrustFields {
  const trustScore = normalized.trustScore ?? 50;
  const riskScore = normalized.riskScore ?? normalizeRiskScore(100 - trustScore);
  const consumerVerdictLabel = normalized.verdict;
  return {
    trustScore,
    riskScore,
    consumerVerdict: scamVerdictFromConsumerLabel(consumerVerdictLabel),
    consumerVerdictLabel,
    consumerVerdictBand: getTrustBandFromScore(trustScore),
    scoreConfidence: result.confidenceLevel ?? "medium"
  };
}

export function alignNormalizedTrustToCanonical(
  normalized: NormalizedTrustResult,
  canonical: CanonicalTrustFields,
  options?: { scanId?: string | null; scoreSource?: NormalizedTrustResult["scoreSource"] }
): NormalizedTrustResult {
  return {
    ...normalized,
    riskScore: canonical.riskScore,
    trustScore: canonical.trustScore,
    verdict: canonical.consumerVerdictLabel,
    scanId: options?.scanId ?? normalized.scanId,
    scoreSource: options?.scoreSource ?? normalized.scoreSource
  };
}

/** Maps legacy API/scoring output into the canonical consumer model. */
export function buildNormalizedTrustFromLegacyResult(
  result: ScamCheckResult,
  options?: { route?: string; displayLock?: import("@/lib/trust/types").TrustDisplayLock | null }
): NormalizedTrustResult {
  return normalizeTrustResult(result, {
    route: options?.route ?? "canonicalTrustBridge",
    displayLock: options?.displayLock ?? null
  });
}

export function buildPublicResultPayloadV2(
  result: ScamCheckResult,
  normalized: NormalizedTrustResult,
  canonical: CanonicalTrustFields
): PublicResultPayloadV2 {
  const aligned = alignNormalizedTrustToCanonical(normalized, canonical, {
    scoreSource: "public_snapshot"
  });
  return {
    schemaVersion: PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION,
    result,
    normalizedTrustResult: serializeNormalizedTrustResult(aligned),
    canonical
  };
}

export function parsePublicResultPayload(
  payload: unknown,
  expectedDomainLower: string
): ParsedPublicResultPayload | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  if (root.schemaVersion === PUBLIC_RESULT_PAYLOAD_SCHEMA_VERSION) {
    const v2 = root as Partial<PublicResultPayloadV2>;
    if (!v2.result || typeof v2.result !== "object") return null;
    const result = v2.result as ScamCheckResult;
    if (typeof result.domain !== "string" || typeof result.score !== "number") return null;
    if (normalizeDomain(result.domain) !== normalizeDomain(expectedDomainLower)) return null;

    const canonical =
      v2.canonical && typeof v2.canonical === "object"
        ? coerceCanonicalFields(v2.canonical as Record<string, unknown>, result)
        : buildCanonicalTrustFieldsFromResult(result);

    const serialized = v2.normalizedTrustResult as SerializedNormalizedTrustResult | undefined;
    const normalizedTrustResult = serialized
      ? alignNormalizedTrustToCanonical(attachRawToNormalized(serialized, result), canonical, {
          scoreSource: "public_snapshot"
        })
      : alignNormalizedTrustToCanonical(buildNormalizedTrustFromLegacyResult(result), canonical, {
          scoreSource: "public_snapshot"
        });

    assertPayloadMatchesCanonical(result, canonical, "parsePublicResultPayload:v2");
    return { result, normalizedTrustResult, canonical, schemaVersion: 2 };
  }

  const legacy = root as Partial<ScamCheckResult>;
  if (typeof legacy.domain !== "string" || typeof legacy.score !== "number") return null;
  if (normalizeDomain(legacy.domain) !== normalizeDomain(expectedDomainLower)) return null;
  if (!legacy.ssl || typeof legacy.ssl !== "object") return null;
  if (!legacy.domainIntelligence || typeof legacy.domainIntelligence !== "object") return null;
  if (!legacy.scoreResult || !Array.isArray(legacy.scoreResult.signals)) return null;
  if (!Array.isArray(legacy.trustSignals)) return null;

  const result = legacy as ScamCheckResult;
  const canonical = buildCanonicalTrustFieldsFromResult(result);
  return {
    result,
    normalizedTrustResult: null,
    canonical,
    schemaVersion: 1
  };
}

function coerceCanonicalFields(
  raw: Record<string, unknown>,
  result: ScamCheckResult
): CanonicalTrustFields {
  const derived = buildCanonicalTrustFieldsFromResult(result);
  const trustScore =
    typeof raw.trustScore === "number" && Number.isFinite(raw.trustScore)
      ? Math.round(raw.trustScore)
      : derived.trustScore;
  const riskScore =
    typeof raw.riskScore === "number" && Number.isFinite(raw.riskScore)
      ? Math.round(raw.riskScore)
      : derived.riskScore;
  const consumerVerdictLabel =
    typeof raw.consumerVerdictLabel === "string"
      ? (raw.consumerVerdictLabel as ConsumerVerdictLabel)
      : standardVerdictLabel(trustScore);
  return {
    trustScore,
    riskScore,
    consumerVerdict:
      typeof raw.consumerVerdict === "string"
        ? (raw.consumerVerdict as ScamVerdict)
        : scamVerdictFromConsumerLabel(consumerVerdictLabel),
    consumerVerdictLabel,
    consumerVerdictBand:
      typeof raw.consumerVerdictBand === "string"
        ? (raw.consumerVerdictBand as TrustBandId)
        : getTrustBandFromScore(trustScore),
    scoreConfidence:
      raw.scoreConfidence === "high" || raw.scoreConfidence === "low"
        ? raw.scoreConfidence
        : derived.scoreConfidence
  };
}

/** Ensures stored JSON cannot contradict persisted snapshot risk/trust columns. */
export function assertPayloadMatchesCanonical(
  result: ScamCheckResult,
  canonical: CanonicalTrustFields,
  source: string
): void {
  const riskFromResult = normalizeRiskScore(result.score);
  if (riskFromResult !== canonical.riskScore) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[canonicalTrustBridge] risk mismatch — aligning to canonical", {
        source,
        domain: result.domain,
        resultRisk: riskFromResult,
        canonicalRisk: canonical.riskScore
      });
    }
    result.score = canonical.riskScore;
  }
  const trustFromResult = displayTrustScoreForResult(result) ?? trustScoreFromRisk(result.score);
  if (trustFromResult !== canonical.trustScore && process.env.NODE_ENV === "development") {
    console.warn("[canonicalTrustBridge] trust drift vs canonical", {
      source,
      domain: result.domain,
      trustFromResult,
      canonicalTrust: canonical.trustScore
    });
  }
}

export type CheckApiCanonicalExtensions = CanonicalTrustFields & {
  normalizedTrustResult: SerializedNormalizedTrustResult;
  consumerVerdictBandDisplay: ReturnType<typeof consumerDisplayBand>;
};

export function buildCheckApiCanonicalExtensions(result: ScamCheckResult): CheckApiCanonicalExtensions {
  const normalized = buildNormalizedTrustFromLegacyResult(result, { route: "api/check" });
  const canonical = buildCanonicalTrustFieldsFromNormalized(normalized, result);
  const aligned = alignNormalizedTrustToCanonical(normalized, canonical, { scoreSource: "live_analysis" });
  return {
    ...canonical,
    normalizedTrustResult: serializeNormalizedTrustResult(aligned),
    consumerVerdictBandDisplay: consumerDisplayBand(canonical.trustScore)
  };
}
