import { ScamAlertStatus } from "@prisma/client";
import { db } from "@/lib/db";

const MS_DAY = 86_400_000;

export type HomeTrustStats = {
  websiteChecks: number;
  threatSignalsAnalyzed: number;
  checksLast30Days: number;
  checksLast24Hours: number;
  fromDatabase: boolean;
};

const DEMO_STATS: HomeTrustStats = {
  websiteChecks: 0,
  threatSignalsAnalyzed: 0,
  checksLast30Days: 0,
  checksLast24Hours: 0,
  fromDatabase: false
};

/**
 * Lightweight aggregates for the homepage trust strip.
 * Falls back to zeros when the database is unavailable (no fake inflation).
 */
export async function getHomeTrustStats(now: Date = new Date()): Promise<HomeTrustStats> {
  try {
    const last30d = new Date(now.getTime() - 30 * MS_DAY);
    const last24h = new Date(now.getTime() - MS_DAY);

    const [websiteChecks, checksLast30Days, checksLast24Hours, alertsLast30d] = await Promise.all([
      db.latestPublicCheck.count(),
      db.latestPublicCheck.count({ where: { lastSeenAt: { gte: last30d } } }),
      db.latestPublicCheck.count({ where: { lastSeenAt: { gte: last24h } } }),
      db.scamAlert.count({
        where: {
          status: ScamAlertStatus.published,
          publishedAt: { gte: last30d }
        }
      })
    ]);

    return {
      websiteChecks,
      threatSignalsAnalyzed: checksLast30Days + alertsLast30d,
      checksLast30Days,
      checksLast24Hours,
      fromDatabase: true
    };
  } catch (e) {
    console.warn("[home] getHomeTrustStats failed", e);
    return DEMO_STATS;
  }
}
