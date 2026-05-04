export type ScamVerdict = "safe" | "suspicious" | "scam";

export interface ScamCheckResult {
  score: number;
  verdict: ScamVerdict;
  domain: string;
  reasons: string[];
}

const VERDICTS: ScamVerdict[] = ["safe", "suspicious", "scam"];

export function isScamCheckResult(value: unknown): value is ScamCheckResult {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (typeof o.score !== "number" || Number.isNaN(o.score)) return false;
  if (typeof o.verdict !== "string" || !VERDICTS.includes(o.verdict as ScamVerdict)) return false;
  if (typeof o.domain !== "string") return false;
  if (!Array.isArray(o.reasons)) return false;
  return o.reasons.every((r) => typeof r === "string");
}
