import { clampScore } from "@/lib/trustSystem";

/** Inputs needed to decide whether the consumer-facing trust gauge should render. */
export type TrustGaugeResultInput = {
  score: number;
  /** Only an explicit `true` suppresses the gauge (legacy payloads may omit). */
  omitTrustScoreGauge?: boolean | null;
};

/**
 * Numeric trust projection (100 − risk), clamped, or null if the stored score cannot be interpreted.
 */
export function trustGaugePercentFromResult(result: Pick<TrustGaugeResultInput, "score">): number | null {
  const s = result.score;
  if (typeof s !== "number" || Number.isNaN(s) || !Number.isFinite(s)) return null;
  return clampScore(100 - s);
}

/** Public-facing trust headline number for metadata / summaries; mirrors ResultCard eligibility. */
export function publicTrustGaugeDisplay(result: TrustGaugeResultInput): number | null {
  if (result.omitTrustScoreGauge === true) return null;
  return trustGaugePercentFromResult(result);
}

/**
 * Whether the radial gauge and progress bar should render.
 * Only `omitTrustScoreGauge === true` suppresses; low confidence or caution-style statuses do not.
 */
export function shouldShowTrustGauge(result: TrustGaugeResultInput): boolean {
  if (result.omitTrustScoreGauge === true) return false;
  const t = trustGaugePercentFromResult(result);
  return typeof t === "number";
}
