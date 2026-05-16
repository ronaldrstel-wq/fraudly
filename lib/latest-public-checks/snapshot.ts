import { normalizeDomain } from "@/lib/cache";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  logDisplayScoreDebug,
  publicDisplayScoreFromLatestRow,
  type PublicDisplayScore
} from "@/lib/scoring/displayScore";

export type LatestPublicCheckSnapshot = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  lastSeenAt: Date;
  display: PublicDisplayScore & { scanId: string };
};

/**
 * Loads the anonymized public feed snapshot for a hostname (same row as `/latest-checks`).
 */
export async function getLatestPublicCheckSnapshotForDomain(
  domainLower: string
): Promise<LatestPublicCheckSnapshot | null> {
  const normalizedValue = normalizeDomain(domainLower);
  try {
    const row = await db.latestPublicCheck.findUnique({
      where: { normalizedValue }
    });
    if (!row) return null;

    const display = publicDisplayScoreFromLatestRow(row);
    logDisplayScoreDebug({
      domain: domainLower,
      scanId: row.id,
      storedRiskScore: row.riskScoreSnapshot,
      storedTrustScore: display.trustScore,
      displayedTrustScore: display.trustScore,
      displayedLabel: display.label,
      source: "getLatestPublicCheckSnapshotForDomain"
    });

    return {
      id: row.id,
      normalizedValue: row.normalizedValue,
      checkedValue: row.checkedValue,
      lastSeenAt: row.lastSeenAt,
      display
    };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2021" || err.code === "P1001")
    ) {
      return null;
    }
    throw err;
  }
}
