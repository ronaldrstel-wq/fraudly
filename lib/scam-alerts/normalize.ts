import { normalizeDomain } from "@/lib/cache";
import type { NormalizedScamSignal } from "@/lib/scam-alerts/types";

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function parseMaybeDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function maybeDomainFromUrl(input?: string): string | undefined {
  if (!input) return undefined;
  try {
    return normalizeDomain(input);
  } catch {
    return undefined;
  }
}

export function normalizeScamSignal(input: NormalizedScamSignal): NormalizedScamSignal {
  const domain = input.domain?.trim() || maybeDomainFromUrl(input.url);
  const normalized = domain ? normalizeDomain(domain) : input.normalizedDomain;
  return {
    ...input,
    domain: domain ?? undefined,
    normalizedDomain: normalized?.trim() || undefined,
    sourceRef: input.sourceRef?.trim() || undefined,
    confidence: clampConfidence(input.confidence),
    firstSeenAt: parseMaybeDate(input.firstSeenAt),
    lastSeenAt: parseMaybeDate(input.lastSeenAt),
    evidence: input.evidence ?? {}
  };
}

export function dedupeSignals(signals: NormalizedScamSignal[]): NormalizedScamSignal[] {
  const byKey = new Map<string, NormalizedScamSignal>();
  for (const signal of signals.map(normalizeScamSignal)) {
    const key = [
      signal.source,
      signal.sourceRef ?? "",
      signal.url ?? "",
      signal.normalizedDomain ?? "",
      signal.scamType ?? ""
    ].join("|");
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, signal);
      continue;
    }
    byKey.set(key, {
      ...existing,
      confidence: Math.max(existing.confidence, signal.confidence),
      riskLevel: existing.riskLevel === "critical" || signal.riskLevel === "critical" ? "critical" : signal.riskLevel,
      firstSeenAt: existing.firstSeenAt && signal.firstSeenAt
        ? new Date(Math.min(existing.firstSeenAt.getTime(), signal.firstSeenAt.getTime()))
        : existing.firstSeenAt ?? signal.firstSeenAt,
      lastSeenAt: existing.lastSeenAt && signal.lastSeenAt
        ? new Date(Math.max(existing.lastSeenAt.getTime(), signal.lastSeenAt.getTime()))
        : existing.lastSeenAt ?? signal.lastSeenAt,
      evidence: { ...existing.evidence, ...signal.evidence }
    });
  }
  return [...byKey.values()];
}
