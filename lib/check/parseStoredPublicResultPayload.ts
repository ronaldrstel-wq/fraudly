import { parsePublicResultPayload } from "@/lib/trust/canonicalTrustBridge";
import type { ScamCheckResult } from "@/types/scam";

/** Validates stored JSON before using it for first paint (legacy rows may omit payload). */
export function parseStoredPublicResultPayload(
  payload: unknown,
  expectedDomainLower: string
): ScamCheckResult | null {
  const parsed = parsePublicResultPayload(payload, expectedDomainLower);
  return parsed?.result ?? null;
}

export { parsePublicResultPayload } from "@/lib/trust/canonicalTrustBridge";
