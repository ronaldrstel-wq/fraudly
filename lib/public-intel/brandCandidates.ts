import { normalizeDomain } from "@/lib/cache";

const BRAND_QUERY_OVERRIDES: Record<string, string[]> = {
  // Known short-domain case where brand is typically listed under full company name.
  "nn.nl": ["Nationale-Nederlanden", "Nationale Nederlanden"]
};

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function buildBrandQueryCandidates(domain: string): string[] {
  const normalized = normalizeDomain(domain);
  const labels = normalized.split(".").filter(Boolean);
  const secondLevel = labels.length > 1 ? labels[labels.length - 2] : labels[0] ?? normalized;
  const humanized = secondLevel.replace(/[-_]+/g, " ").trim();
  const overrides = BRAND_QUERY_OVERRIDES[normalized] ?? [];
  return dedupe([normalized, secondLevel, humanized, ...overrides]);
}
