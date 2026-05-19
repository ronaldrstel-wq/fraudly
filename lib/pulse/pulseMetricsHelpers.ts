import type { PulseIntelligenceTile } from "@/lib/pulse/types";
import type { ReputationEnrichment } from "@/lib/outscraper/reputation";

export function extractTld(domain: string): string | null {
  const parts = domain.trim().toLowerCase().split(".").filter(Boolean);
  if (parts.length < 2) return null;
  return `.${parts[parts.length - 1]}`;
}

export function parseDomainAgeDays(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const publicSignals = p.publicSignals;
  if (!publicSignals || typeof publicSignals !== "object") return null;
  const age = (publicSignals as Record<string, unknown>).domainAgeDays;
  return typeof age === "number" && Number.isFinite(age) ? Math.max(0, Math.round(age)) : null;
}

export function parseReviewScore(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const enrichment = payload as ReputationEnrichment;
  const scores: number[] = [];
  if (typeof enrichment.googleRating === "number" && enrichment.googleRating > 0) {
    scores.push(enrichment.googleRating);
  }
  if (typeof enrichment.trustpilotRating === "number" && enrichment.trustpilotRating > 0) {
    scores.push(enrichment.trustpilotRating);
  }
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function topCountMap(labels: string[]): { label: string; count: number } | null {
  const map = new Map<string, number>();
  for (const raw of labels) {
    const label = raw.trim();
    if (!label) continue;
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  let best: { label: string; count: number } | null = null;
  for (const [label, count] of map) {
    if (!best || count > best.count) best = { label, count };
  }
  return best;
}

export function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function pickInsightOfDay(input: {
  scansToday: number;
  suspiciousToday: number;
  averageRiskyDomainAgeDays: number | null;
  riskyDomainsWithAgeCount: number;
  topBrand: { label: string; count: number } | null;
  newRiskyDomains7d: number;
}): Omit<PulseIntelligenceTile, "id" | "featured"> {
  if (input.averageRiskyDomainAgeDays != null && input.averageRiskyDomainAgeDays >= 365 * 3 && input.riskyDomainsWithAgeCount >= 5) {
    const years = (input.averageRiskyDomainAgeDays / 365).toFixed(1);
    return {
      title: "Fraudly insight of the day",
      value: `${years} yr avg age`,
      explanation:
        "Risky sites in our feed are not all brand-new. Mature domains are often reused after hacks, expired registrations, or long-running questionable shops—age alone does not mean safe.",
      reliability: input.riskyDomainsWithAgeCount >= 20 ? "reliable" : "limited",
      confidenceNote: `Based on ${input.riskyDomainsWithAgeCount} risky domains with age data · ${input.riskyDomainsWithAgeCount >= 20 ? "Reliable" : "Early trend"}`,
      accent: "blue"
    };
  }

  if (input.scansToday >= 10 && input.suspiciousToday / Math.max(1, input.scansToday) >= 0.35) {
    const pct = Math.round((input.suspiciousToday / input.scansToday) * 100);
    return {
      title: "Fraudly insight of the day",
      value: `${pct}% cautious today`,
      explanation:
        "A higher share of suspicious signals today suggests shoppers should slow down—verify payment pages, contact details, and reviews before checkout.",
      reliability: input.scansToday >= 20 ? "reliable" : "limited",
      confidenceNote: `Based on ${input.scansToday} checks in 24h · ${input.scansToday >= 20 ? "Reliable" : "Early trend"}`,
      accent: "amber"
    };
  }

  if (input.topBrand && input.topBrand.count >= 3) {
    return {
      title: "Fraudly insight of the day",
      value: input.topBrand.label,
      explanation: `Brand impersonation remains active—${input.topBrand.label} is the most cited brand in recent published alerts. Double-check URLs and sender addresses.`,
      reliability: input.topBrand.count >= 8 ? "reliable" : "limited",
      confidenceNote: `${input.topBrand.count} alerts in 30 days · ${input.topBrand.count >= 8 ? "Reliable" : "Early trend"}`,
      accent: "violet"
    };
  }

  if (input.newRiskyDomains7d >= 5) {
    return {
      title: "Fraudly insight of the day",
      value: `${input.newRiskyDomains7d} new risky`,
      explanation:
        "Several new risky domains appeared this week. Treat unfamiliar shops and login pages with extra caution until you have independent confirmation.",
      reliability: input.newRiskyDomains7d >= 12 ? "reliable" : "limited",
      confidenceNote: `Unique domains in 7 days · ${input.newRiskyDomains7d >= 12 ? "Reliable" : "Early trend"}`,
      accent: "rose"
    };
  }

  return {
    title: "Fraudly insight of the day",
    value: "Patterns forming",
    explanation:
      "Fraudly Pulse aggregates public checks and scam alerts. Insights strengthen as more scans complete—check back as the live feed grows.",
    reliability: "building",
    confidenceNote: "Limited sample",
    accent: "blue"
  };
}
