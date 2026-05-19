import { ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { PUBLIC_SNAPSHOT_LABEL_STRONG_RISK, verdictFromPublicSnapshotLabel } from "@/lib/latest-public-checks/status-label";
import { buildIntelligenceTiles } from "@/lib/pulse/buildIntelligenceTiles";
import {
  extractTld,
  parseDomainAgeDays,
  parseReviewScore,
  percent,
  pickInsightOfDay,
  topCountMap
} from "@/lib/pulse/pulseMetricsHelpers";
import type { FraudlyPulseStats, PulseHighRiskFeedItem, PulseTrendBucket } from "@/lib/pulse/types";

export type {
  FraudlyPulseStats,
  PulseHighRiskFeedItem,
  PulseIntelligenceTile,
  PulseKpi,
  PulseRankItem,
  PulseReliability,
  PulseTrendBucket
} from "@/lib/pulse/types";

const MS_DAY = 86_400_000;

function utcStartOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isHighRiskRow(row: { statusLabel: string; riskScoreSnapshot: number }): boolean {
  const verdict = verdictFromPublicSnapshotLabel(row.statusLabel);
  return verdict === "scam" || row.riskScoreSnapshot >= 70;
}

function describeRiskReason(label: string): string {
  if (label === PUBLIC_SNAPSHOT_LABEL_STRONG_RISK) return "Strong risk indicators in this public snapshot.";
  return "Elevated risk pattern detected in this public check.";
}

function emptyStats(now: Date): FraudlyPulseStats {
  const start = utcStartOfDay(now);
  const trendBuckets: PulseTrendBucket[] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(start.getTime() - i * MS_DAY);
    trendBuckets.push({ day: dayKey(day), checks: 0, suspicious: 0, highRisk: 0, alerts: 0 });
  }

  const insightOfDay = pickInsightOfDay({
    scansToday: 0,
    suspiciousToday: 0,
    averageRiskyDomainAgeDays: null,
    riskyDomainsWithAgeCount: 0,
    topBrand: null,
    newRiskyDomains7d: 0
  });

  return {
    generatedAt: now,
    intelligenceTiles: buildIntelligenceTiles({
      scansToday: 0,
      suspiciousToday: 0,
      highRiskToday: 0,
      suspiciousPctToday: "—",
      highRiskPctToday: "—",
      newHighRiskDomains24h: 0,
      newRiskyDomains7d: 0,
      riskyDomainCount30d: 0,
      riskyDomainsWithAgeCount: 0,
      averageRiskyDomainAgeDays: null,
      topBrand: null,
      topCategory: null,
      topTld: null,
      avgRiskyReviewScore: null,
      riskyDomainsWithReviewCount: 0,
      insightOfDay
    }),
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

export async function getFraudlyPulseStats(now: Date = new Date()): Promise<FraudlyPulseStats> {
  try {
    const startToday = utcStartOfDay(now);
    const last24h = new Date(now.getTime() - MS_DAY);
    const last7d = new Date(now.getTime() - 7 * MS_DAY);
    const last30d = new Date(now.getTime() - 30 * MS_DAY);

    const [todayRows, rows30d, rows7d, alerts30d, recentHighRiskRows, brandGroups, categoryGroups] =
      await Promise.all([
        db.latestPublicCheck.findMany({
          where: { lastSeenAt: { gte: last24h } },
          select: { id: true, normalizedValue: true, riskScoreSnapshot: true, statusLabel: true, lastSeenAt: true }
        }),
        db.latestPublicCheck.findMany({
          where: { lastSeenAt: { gte: last30d } },
          select: {
            id: true,
            normalizedValue: true,
            riskScoreSnapshot: true,
            statusLabel: true,
            lastSeenAt: true,
            publicResultPath: true,
            checkedValue: true
          }
        }),
        db.latestPublicCheck.findMany({
          where: { lastSeenAt: { gte: last7d } },
          select: { normalizedValue: true, riskScoreSnapshot: true, statusLabel: true }
        }),
        db.scamAlert.findMany({
          where: { status: ScamAlertStatus.published, publishedAt: { gte: last30d } },
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
    const highRiskToday = todayRows.filter(isHighRiskRow).length;

    const riskyRows30d = rows30d.filter(isHighRiskRow);
    const riskyDomainList = [...new Set(riskyRows30d.map((row) => row.normalizedValue))];

    const newHighRiskDomains24h = new Set(
      todayRows.filter(isHighRiskRow).map((row) => row.normalizedValue)
    ).size;

    const newRiskyDomains7d = new Set(rows7d.filter(isHighRiskRow).map((row) => row.normalizedValue)).size;

    let averageRiskyDomainAgeDays: number | null = null;
    let riskyDomainsWithAgeCount = 0;
    const reviewScores: number[] = [];

    if (riskyDomainList.length > 0) {
      const ageRows = await db.reputationEnrichmentCache.findMany({
        where: { normalizedDomain: { in: riskyDomainList } },
        select: { payload: true }
      });
      const ages: number[] = [];
      for (const row of ageRows) {
        const age = parseDomainAgeDays(row.payload);
        if (age != null) ages.push(age);
        const review = parseReviewScore(row.payload);
        if (review != null) reviewScores.push(review);
      }
      riskyDomainsWithAgeCount = ages.length;
      if (ages.length > 0) {
        averageRiskyDomainAgeDays = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
      }
    }

    const avgRiskyReviewScore =
      reviewScores.length > 0
        ? Math.round((reviewScores.reduce((a, b) => a + b, 0) / reviewScores.length) * 10) / 10
        : null;

    const topTld = topCountMap(
      riskyRows30d.map((row) => extractTld(row.normalizedValue)).filter((t): t is string => Boolean(t))
    );

    const brandRank = brandGroups
      .map((row) => ({ label: row.affectedBrand ?? "", count: row._count._all }))
      .filter((row) => row.label.trim().length > 0)
      .sort((a, b) => b.count - a.count);
    const topBrand = brandRank[0] ?? null;

    const categoryRank = categoryGroups
      .map((row) => ({ label: row.scamType, count: row._count._all }))
      .sort((a, b) => b.count - a.count);
    const topCategory = categoryRank[0] ?? null;

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
      if (isHighRiskRow(row)) bucket.highRisk += 1;
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
    const highRisk30d = riskyRows30d.length;
    const alertsCount30d = alerts30d.length;

    const insightOfDay = pickInsightOfDay({
      scansToday,
      suspiciousToday,
      averageRiskyDomainAgeDays,
      riskyDomainsWithAgeCount,
      topBrand,
      newRiskyDomains7d
    });

    const intelligenceTiles = buildIntelligenceTiles({
      scansToday,
      suspiciousToday,
      highRiskToday,
      suspiciousPctToday: percent(suspiciousToday, scansToday),
      highRiskPctToday: percent(highRiskToday, scansToday),
      newHighRiskDomains24h,
      newRiskyDomains7d,
      riskyDomainCount30d: riskyDomainList.length,
      riskyDomainsWithAgeCount,
      averageRiskyDomainAgeDays,
      topBrand,
      topCategory,
      topTld,
      avgRiskyReviewScore,
      riskyDomainsWithReviewCount: reviewScores.length,
      insightOfDay
    });

    return {
      generatedAt: now,
      intelligenceTiles,
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
