import type { ProviderCategory, ProviderConfidence, ProviderEvidenceResult, ProviderSeverity } from "@/lib/checks/providers/types";

export function evidenceUnavailable(
  source: string,
  category: ProviderCategory,
  description: string,
  confidence: ProviderConfidence = "low"
): ProviderEvidenceResult {
  return {
    source,
    category,
    severity: "info",
    matched: false,
    title: "Check unavailable",
    description,
    confidence
  };
}

export function wrapEvidence(
  source: string,
  category: ProviderCategory,
  severity: ProviderSeverity,
  matched: boolean,
  title: string,
  description: string,
  confidence: ProviderConfidence,
  raw?: unknown
): ProviderEvidenceResult {
  return { source, category, severity, matched, title, description, confidence, raw };
}

export async function runWithDeadline<T>(label: string, ms: number, fn: () => Promise<T>): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return fn();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
