import { ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PUBLIC_SNAPSHOT_LABEL_MIXED, PUBLIC_SNAPSHOT_LABEL_STRONG_RISK, verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";

type Reliability = "reliable" | "limited" | "building";

export type PulseKpi = {
  title: string;
  value: string;
  explanation: string;
  reliability: Reliability;
  trend: string | null;
};

export type PulseRankItem = {
  label: string;
  count: number;
};

export type PulseTrendBucket = {
  day: string;
  checks: number;
  suspicious: number;
  highRisk: number;
  alerts: number;
};

export type PulseHighRiskFeedItem = {
  id: string;
  domain: string;
  score: number;
  statusLabel: string;
  checkedAt: Date;
  href: string;
  reason: string;
};

export type FraudlyPulseStats = {
  generatedAt: Date;
  kpis: {
    websitesCheckedToday: PulseKpi;
    suspiciousPercentage: PulseKpi;
    highRiskPercentage: PulseKpi;
    newScamDomainsDetected: PulseKpi;
    averageRiskyDomainAgeDays: PulseKpi;
  };
  mostImpersonatedBrands: PulseRankItem[];
  mostCommonScamCategories: PulseRankItem[];
  topHostingCountries: PulseRankItem[];
  recentHighRiskDetections: PulseHighRiskFeedItem[];
  trendBuckets: PulseTrendBucket[];
  coverage: {
    todayScans: number;
    last30dScans: number;
    last30dHighRisk: number;
    last30dSuspicious: number;
    last30dAlerts: number;
  };
};

function emptyStats(now: Date): FraudlyPulseStats {
  const start = utcStartOfDay(now);
  const trendBuckets: PulseTrendBucket[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(start.getTime() - i * MS_DAY);
    trendBuckets.push({ day: dayKey(day), checks: 0, suspicious: 0, highRisk: 0, alerts: 0 });
  }
  return {
    generatedAt: now,
    kpis: {
      websitesCheckedToday: {
        title: "Websites checked today",
        value: "0",
        explanation: "Public scans completed in the last 24 hours.",
        reliability: "building",
        trend: "Trend data is building."
      },
      suspiciousPercentage: {
        title: "% flagged as suspicious",
        value: "—",
        explanation: "Checks with caution or elevated-risk signals.",
        reliability: "building",
        trend: "Not enough data yet."
      },
      highRiskPercentage: {
        title: "% high-risk",
        value: "—",
        explanation: "Checks with strong scam or phishing indicators.",
        reliability: "building",
        trend: "Not enough data yet."
      },
      newScamDomainsDetected: {
        title: "New scam domains detected",
        value: "0",
        explanation: "Recently published scam-alert domains from the last 30 days.",
        reliability: "building",
        trend: "Trend data is building."
      },
      averageRiskyDomainAgeDays: {
        title: "Average domain age of risky sites",
        value: "Not enough data yet",
        explanation: "Younger risky domains can be a common scam signal.",
        reliability: "building",
        trend: null
      }
    },
    mostImpersonatedBrands: [],
    mostCommonScamCategories: [],
    topHostingCountries: [],
    recentHighRiskDetections: [],
    trendBuckets,
    coverage: {
      todayScans: 0,
      last30dScans: 0,
      last30dHighRisk: 0,
      last30dSuspicious: 0,
      last30dAlerts: 0
    }
  };
}

const MS_DAY = 86_400_000;

function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function reliabilityForCount(count: number, reliableAt: number, limitedAt = 1): Reliability {
  if (count >= reliableAt) return "reliable";
  if (count >= limitedAt) return "limited";
  return "building";
}

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function parseDomainAgeDays(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const publicSignals = p.publicSignals;
  if (!publicSignals || typeof publicSignals !== "object") return null;
  const age = (publicSignals as Record<string, unknown>).domainAgeDays;
  return typeof age === "number" && Number.isFinite(age) ? Math.max(0, Math.round(age)) : null;
}

function describeRiskReason(label: string): string {
  if (label === PUBLIC_SNAPSHOT_LABEL_STRONG_RISK) return "Strong risk indicators in this public snapshot.";
  if (label === PUBLIC_SNAPSHOT_LABEL_MIXED) return "Mixed caution signals in this public snapshot.";
  return "Elevated risk pattern detected in this public check.";
}

export async function getFraudlyPulseStats(now: Date = new Date()): Promise<FraudlyPulseStats> {
  try {
    const startToday = utcStartOfDay(now);
    const last24h = new Date(now.getTime() - MS_DAY);
    const last7d = new Date(now.getTime() - 7 * MS_DAY);
    const last30d = new Date(now.getTime() - 30 * MS_DAY);

    const [todayRows, rows30d, alerts30d, recentHighRiskRows, brandGroups, categoryGroups] = await Promise.all([
    db.latestPublicCheck.findMany({
      where: { lastSeenAt: { gte: last24h } },
      select: { id: true, riskScoreSnapshot: true, statusLabel: true, lastSeenAt: true }
    }),
    db.latestPublicCheck.findMany({
      where: { lastSeenAt: { gte: last30d } },
      select: { id: true, normalizedValue: true, riskScoreSnapshot: true, statusLabel: true, lastSeenAt: true, publicResultPath: true }
    }),
    db.scamAlert.findMany({
      where: {
        status: ScamAlertStatus.published,
        publishedAt: { gte: last30d }
      },
      select: { domain: true, publishedAt: true, affectedBrand: true, scamType: true }
    }),
    db.latestPublicCheck.findMany({
      where: {
        lastSeenAt: { gte: last7d },
        OR: [{ statusLabel: PUBLIC_SNAPSHOT_LABEL_STRONG_RISK }, { riskScoreSnapshot: { gte: 70 } }]
      },
      orderBy: { lastSeenAt: "desc" },
      take: 12,
      select: {
        id: true,
        checkedValue: true,
        normalizedValue: true,
        riskScoreSnapshot: true,
        statusLabel: true,
        lastSeenAt: true,
        publicResultPath: true
      }
    }),
    db.scamAlert.groupBy({
      by: ["affectedBrand"],
      where: {
        status: ScamAlertStatus.published,
        publishedAt: { gte: last30d },
        NOT: { affectedBrand: null }
      },
      _count: { _all: true }
    }),
    db.scamAlert.groupBy({
      by: ["scamType"],
      where: { status: ScamAlertStatus.published, publishedAt: { gte: last30d } },
      _count: { _all: true }
    })
    ]);

    const scansToday = todayRows.length;
    const suspiciousToday = todayRows.filter((row) => {
    const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
    return verdict === "suspicious" || verdict === "scam";
    }).length;
    const highRiskToday = todayRows.filter((row) => {
    const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
    return verdict === "scam" || row.riskScoreSnapshot >= 70;
    }).length;

    const riskyDomains = new Set(
    rows30d
      .filter((row) => verdictFromPublicSnapshotLabel(row.statusLabel) === "scam" || row.riskScoreSnapshot >= 70)
      .map((row) => row.normalizedValue)
    );
    const riskyDomainList = [...riskyDomains];

    let averageRiskyDomainAgeDays: number | null = null;
    if (riskyDomainList.length > 0) {
      const ageRows = await db.reputationEnrichmentCache.findMany({
      where: { normalizedDomain: { in: riskyDomainList } },
      select: { payload: true }
    });
      const ages = ageRows.map((row) => parseDomainAgeDays(row.payload)).filter((v): v is number => typeof v === "number");
      if (ages.length > 0) {
        averageRiskyDomainAgeDays = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
      }
    }
    

    const brandRank = brandGroups
    .map((row) => ({ label: row.affectedBrand ?? "", count: row._count._all }))
    .filter((row) => row.label.trim().length > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

    const categoryRank = categoryGroups
    .map((row) => ({ label: row.scamType, count: row._count._all }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

    const alertsDomainSet = new Set(
    alerts30d
      .map((row) => row.domain?.trim().toLowerCase())
      .filter((domain): domain is string => Boolean(domain))
    );

    const trendMap = new Map<string, PulseTrendBucket>();
    for (let i = 29; i >= 0; i -= 1) {
      const day = new Date(startToday.getTime() - i * MS_DAY);
      const key = dayKey(day);
      trendMap.set(key, { day: key, checks: 0, suspicious: 0, highRisk: 0, alerts: 0 });
    }
    for (const row of rows30d) {
    const key = dayKey(row.lastSeenAt);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    bucket.checks += 1;
    const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
    if (verdict === "suspicious" || verdict === "scam") bucket.suspicious += 1;
    if (verdict === "scam" || row.riskScoreSnapshot >= 70) bucket.highRisk += 1;
    }
    for (const row of alerts30d) {
    if (!row.publishedAt) continue;
    const key = dayKey(row.publishedAt);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    bucket.alerts += 1;
    }
    const trendBuckets = [...trendMap.values()];
    const scans30d = rows30d.length;
    const suspicious30d = rows30d.filter((row) => {
    const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
    return verdict === "suspicious" || verdict === "scam";
    }).length;
    const highRisk30d = rows30d.filter((row) => {
    const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
    return verdict === "scam" || row.riskScoreSnapshot >= 70;
    }).length;
    const alertsCount30d = alerts30d.length;

    return {
    generatedAt: now,
    kpis: {
      websitesCheckedToday: {
        title: "Websites checked today",
        value: String(scansToday),
        explanation: "Public scans completed in the last 24 hours.",
        reliability: reliabilityForCount(scansToday, 20),
        trend: scans30d > 0 ? `30d average: ${Math.max(1, Math.round(scans30d / 30))}/day` : null
      },
      suspiciousPercentage: {
        title: "% flagged as suspicious",
        value: percent(suspiciousToday, scansToday),
        explanation: "Checks with caution or elevated-risk signals.",
        reliability: reliabilityForCount(scansToday, 20),
        trend: scansToday > 0 ? `${suspiciousToday} of ${scansToday} checks` : null
      },
      highRiskPercentage: {
        title: "% high-risk",
        value: percent(highRiskToday, scansToday),
        explanation: "Checks with strong scam or phishing indicators.",
        reliability: reliabilityForCount(highRiskToday, 5, 1),
        trend: scansToday > 0 ? `${highRiskToday} high-risk checks today` : null
      },
      newScamDomainsDetected: {
        title: "New scam domains detected",
        value: String(alertsDomainSet.size),
        explanation: "Recently published scam-alert domains from the last 30 days.",
        reliability: reliabilityForCount(alertsDomainSet.size, 5, 1),
        trend:
          alertsCount30d > 0
            ? `${alertsCount30d} published alert${alertsCount30d === 1 ? "" : "s"} in 30 days`
            : null
      },
      averageRiskyDomainAgeDays: {
        title: "Average domain age of risky sites",
        value: averageRiskyDomainAgeDays == null ? "Not enough data yet" : `${averageRiskyDomainAgeDays} days`,
        explanation: "Younger risky domains can be a common scam signal.",
        reliability: averageRiskyDomainAgeDays == null ? "building" : reliabilityForCount(riskyDomainList.length, 20),
        trend: averageRiskyDomainAgeDays == null ? null : `Based on ${riskyDomainList.length} risky domains with age data`
      }
    },
    mostImpersonatedBrands: brandRank,
    mostCommonScamCategories: categoryRank,
    topHostingCountries: [],
    recentHighRiskDetections: recentHighRiskRows.map((row) => ({
      id: row.id,
      domain: row.checkedValue || row.normalizedValue,
      score: 100 - Math.max(0, Math.min(100, row.riskScoreSnapshot)),
      statusLabel: row.statusLabel,
      checkedAt: row.lastSeenAt,
      href: row.publicResultPath,
      reason: describeRiskReason(row.statusLabel)
    })),
    trendBuckets,
    coverage: {
      todayScans: scansToday,
      last30dScans: scans30d,
      last30dHighRisk: highRisk30d,
      last30dSuspicious: suspicious30d,
      last30dAlerts: alertsCount30d
    }
    };
  } catch (error) {
    console.warn("[pulse] fallback to empty stats:", error instanceof Error ? error.message : String(error));
    return emptyStats(now);
  }
}
