import { normalizeDomain } from "@/lib/cache";
import type { ScamCheckResult } from "@/types/scam";

/** Validates stored JSON before using it for first paint (legacy rows may omit payload). */
export function parseStoredPublicResultPayload(
  payload: unknown,
  expectedDomainLower: string
): ScamCheckResult | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Partial<ScamCheckResult>;
  if (typeof r.domain !== "string" || typeof r.score !== "number") return null;
  if (normalizeDomain(r.domain) !== normalizeDomain(expectedDomainLower)) return null;
  if (!r.ssl || typeof r.ssl !== "object") return null;
  if (!r.domainIntelligence || typeof r.domainIntelligence !== "object") return null;
  return r as ScamCheckResult;
}
