import type { DomainAdminOverride } from "@prisma/client";
import type { ScamCheckResult } from "@/types/scam";

function cloneWith<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function applyDomainOverrideToResult(
  result: ScamCheckResult,
  override: DomainAdminOverride | null
): ScamCheckResult {
  if (!override || override.overrideVerdict === "none") return result;
  const next = cloneWith(result);
  const nowIso = new Date().toISOString();

  if (override.overrideVerdict === "trusted") {
    next.score = 15;
    next.verdict = "safe";
    next.siteStatus = "trusted";
  } else if (override.overrideVerdict === "suspicious") {
    next.score = 45;
    next.verdict = "suspicious";
    next.siteStatus = "caution";
  } else {
    next.score = 80;
    next.verdict = "scam";
    next.siteStatus = "high_risk";
  }

  next.reasons = [
    `Admin override applied: ${override.overrideVerdict.replace("_", " ")}`,
    ...(override.note ? [`Admin note: ${override.note}`] : []),
    ...next.reasons
  ].slice(0, 8);
  next.adminOverride = {
    verdict: override.overrideVerdict,
    note: override.note ?? null,
    appliedAt: nowIso
  };

  return next;
}
