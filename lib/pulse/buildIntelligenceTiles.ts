import type { PulseIntelligenceTile, PulseReliability } from "@/lib/pulse/types";

export type PulseTileMetrics = {
  scansToday: number;
  suspiciousToday: number;
  highRiskToday: number;
  suspiciousPctToday: string;
  highRiskPctToday: string;
  newHighRiskDomains24h: number;
  newRiskyDomains7d: number;
  riskyDomainCount30d: number;
  riskyDomainsWithAgeCount: number;
  averageRiskyDomainAgeDays: number | null;
  topBrand: { label: string; count: number } | null;
  topCategory: { label: string; count: number } | null;
  topTld: { label: string; count: number } | null;
  avgRiskyReviewScore: number | null;
  riskyDomainsWithReviewCount: number;
  insightOfDay: Omit<PulseIntelligenceTile, "id" | "featured">;
};

function reliabilityForCount(count: number, reliableAt: number, limitedAt = 1): PulseReliability {
  if (count >= reliableAt) return "reliable";
  if (count >= limitedAt) return "limited";
  return "building";
}

function confidenceLabel(level: PulseReliability): string {
  if (level === "reliable") return "Reliable";
  if (level === "limited") return "Early trend";
  return "Limited sample";
}

type TileInput = Omit<PulseIntelligenceTile, "reliability" | "confidenceNote"> & {
  reliability?: PulseReliability;
  confidenceNote?: string;
  sampleCount?: number;
  reliableAt?: number;
  limitedAt?: number;
};

function tile(partial: TileInput): PulseIntelligenceTile {
  const reliableAt = partial.reliableAt ?? 20;
  const limitedAt = partial.limitedAt ?? 1;
  const count = partial.sampleCount ?? 0;
  const reliability =
    partial.reliability ?? reliabilityForCount(count, reliableAt, limitedAt);
  const { sampleCount: _s, reliableAt: _r, limitedAt: _l, ...rest } = partial;
  const confidenceNote =
    partial.confidenceNote ??
    (count > 0
      ? `Based on ${count} ${count === 1 ? "signal" : "signals"} · ${confidenceLabel(reliability)}`
      : confidenceLabel(reliability));

  return { ...rest, reliability, confidenceNote };
}

export function buildIntelligenceTiles(m: PulseTileMetrics): PulseIntelligenceTile[] {
  const scansRel = reliabilityForCount(m.scansToday, 20);
  const suspiciousRel = reliabilityForCount(m.scansToday, 20);
  const highRiskRel = reliabilityForCount(m.highRiskToday, 5, 1);

  const ageRel =
    m.averageRiskyDomainAgeDays == null
      ? "building"
      : reliabilityForCount(m.riskyDomainsWithAgeCount, 20);

  const reviewRel =
    m.avgRiskyReviewScore == null ? "building" : reliabilityForCount(m.riskyDomainsWithReviewCount, 10, 3);

  const tiles: PulseIntelligenceTile[] = [
    tile({
      id: "sites-checked-today",
      title: "Sites checked today",
      value: String(m.scansToday),
      explanation: "Public trust scans completed in the last 24 hours across Fraudly.",
      accent: "blue",
      sampleCount: m.scansToday,
      reliableAt: 20
    }),
    tile({
      id: "suspicious-today",
      title: "% suspicious today",
      value: m.suspiciousPctToday,
      explanation: "Share of today’s checks that surfaced caution or elevated-risk signals.",
      accent: "amber",
      sampleCount: m.scansToday,
      reliability: suspiciousRel
    }),
    tile({
      id: "new-high-risk-24h",
      title: "New high-risk domains",
      value: String(m.newHighRiskDomains24h),
      explanation: "Unique domains flagged high-risk in the last 24 hours—worth a closer look before you pay or log in.",
      accent: "rose",
      sampleCount: m.newHighRiskDomains24h,
      reliableAt: 5,
      limitedAt: 1,
      reliability: highRiskRel
    }),
    tile({
      id: "avg-risky-domain-age",
      title: "Average domain age of risky sites",
      value: m.averageRiskyDomainAgeDays == null ? "—" : `${m.averageRiskyDomainAgeDays.toLocaleString("en-GB")} days`,
      explanation:
        "Risk is not only about new domains. Older risky domains can point to hacked websites, reused expired domains, or long-running suspicious shops.",
      accent: "slate",
      sampleCount: m.riskyDomainsWithAgeCount,
      reliability: ageRel,
      confidenceNote:
        m.riskyDomainsWithAgeCount > 0
          ? `Based on ${m.riskyDomainsWithAgeCount} risky domains with age data · ${confidenceLabel(ageRel)}`
          : "Limited sample"
    }),
    m.topBrand
      ? tile({
          id: "top-impersonated-brand",
          title: "Most impersonated brand",
          value: m.topBrand.label,
          explanation: `Appears in ${m.topBrand.count} published scam alert${m.topBrand.count === 1 ? "" : "s"} in the last 30 days.`,
          accent: "violet",
          sampleCount: m.topBrand.count,
          reliableAt: 5,
          limitedAt: 1
        })
      : tile({
          id: "top-impersonated-brand",
          title: "Most impersonated brand",
          value: "—",
          explanation: "Brand impersonation patterns will appear as more scam alerts are published.",
          accent: "violet",
          reliability: "building",
          confidenceNote: "Limited sample"
        }),
    m.topCategory
      ? tile({
          id: "top-scam-category",
          title: "Most common scam category",
          value: m.topCategory.label,
          explanation: `Leading scam type in published alerts (${m.topCategory.count} in 30 days).`,
          accent: "violet",
          sampleCount: m.topCategory.count,
          reliableAt: 5,
          limitedAt: 1
        })
      : tile({
          id: "top-scam-category",
          title: "Most common scam category",
          value: "—",
          explanation: "Category mix is still forming from published threat intelligence.",
          accent: "violet",
          reliability: "building",
          confidenceNote: "Limited sample"
        }),
    m.topTld
      ? tile({
          id: "top-flagged-tld",
          title: "Most flagged TLD",
          value: m.topTld.label,
          explanation: `Among risky domains checked recently, ${m.topTld.label} appears most often (${m.topTld.count} sites).`,
          accent: "amber",
          sampleCount: m.topTld.count,
          reliableAt: 8,
          limitedAt: 2
        })
      : tile({
          id: "top-flagged-tld",
          title: "Most flagged TLD",
          value: "—",
          explanation: "Top-level domain patterns will surface once enough risky checks are in the feed.",
          accent: "amber",
          reliability: "building",
          confidenceNote: "Limited sample"
        }),
    tile({
      id: "avg-risky-review-score",
      title: "Average review score of risky sites",
      value: m.avgRiskyReviewScore == null ? "—" : `${m.avgRiskyReviewScore.toFixed(1)} / 5`,
      explanation:
        "When review data exists, unusually low ratings on flagged shops can reinforce other scam signals—always verify independently.",
      accent: "emerald",
      sampleCount: m.riskyDomainsWithReviewCount,
      reliability: reviewRel
    }),
    tile({
      id: "new-risky-week",
      title: "Newly detected risky domains this week",
      value: String(m.newRiskyDomains7d),
      explanation: "Unique domains flagged as risky in the last 7 days across public Fraudly checks.",
      accent: "rose",
      sampleCount: m.newRiskyDomains7d,
      reliableAt: 8,
      limitedAt: 1
    }),
    { ...m.insightOfDay, id: "insight-of-day", featured: true }
  ];

  return tiles;
}
