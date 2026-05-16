import { normalizeDomain } from "@/lib/cache";
import { parseStoredPublicResultPayload } from "@/lib/check/parseStoredPublicResultPayload";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  logDisplayScoreDebug,
  publicDisplayScoreFromLatestRow,
  type PublicDisplayScore
} from "@/lib/scoring/displayScore";
import { enrichScamCheckResultDomainAge } from "@/lib/domain/normalizeDomainAge";
import type { ScamCheckResult } from "@/types/scam";

export type LatestPublicCheckSnapshot = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  lastSeenAt: Date;
  display: PublicDisplayScore & { scanId: string };
  storedResult: ScamCheckResult | null;
};

type SnapshotRowBase = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  lastSeenAt: Date;
  publicResultPayload?: unknown;
};

const snapshotSelectBase = {
  id: true,
  normalizedValue: true,
  checkedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  lastSeenAt: true
} as const;

function isPrismaReadSkipped(err: unknown): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return (
    err.code === "P2021" ||
    err.code === "P1001" ||
    err.code === "P2022" ||
    err.code === "P2010"
  );
}

function rowToSnapshot(row: SnapshotRowBase, domainLower: string): LatestPublicCheckSnapshot {
  const display = publicDisplayScoreFromLatestRow(row);
  logDisplayScoreDebug({
    domain: domainLower,
    scanId: row.id,
    storedRiskScore: row.riskScoreSnapshot,
    storedTrustScore: display.trustScore,
    displayedTrustScore: display.trustScore,
    displayedLabel: display.label,
    source: "latest-public-check-snapshot"
  });

  const parsedPayload = row.publicResultPayload
    ? parseStoredPublicResultPayload(row.publicResultPayload, domainLower)
    : null;
  const storedResult = parsedPayload ? enrichScamCheckResultDomainAge(parsedPayload) : null;

  return {
    id: row.id,
    normalizedValue: row.normalizedValue,
    checkedValue: row.checkedValue,
    lastSeenAt: row.lastSeenAt,
    display,
    storedResult
  };
}

async function findSnapshotRow(where: { normalizedValue: string } | { id: string }): Promise<SnapshotRowBase | null> {
  try {
    const row = await db.latestPublicCheck.findUnique({
      where,
      select: { ...snapshotSelectBase, publicResultPayload: true }
    });
    return row;
  } catch (err) {
    if (!isPrismaReadSkipped(err)) throw err;
    try {
      return await db.latestPublicCheck.findUnique({ where, select: snapshotSelectBase });
    } catch (fallbackErr) {
      if (isPrismaReadSkipped(fallbackErr)) return null;
      throw fallbackErr;
    }
  }
}

export async function getLatestPublicCheckSnapshotForDomain(
  domainLower: string
): Promise<LatestPublicCheckSnapshot | null> {
  const normalizedValue = normalizeDomain(domainLower);
  try {
    const row = await findSnapshotRow({ normalizedValue });
    if (!row) return null;
    return rowToSnapshot(row, domainLower);
  } catch (err) {
    if (isPrismaReadSkipped(err)) return null;
    throw err;
  }
}

export async function getLatestPublicCheckSnapshotById(scanId: string): Promise<LatestPublicCheckSnapshot | null> {
  try {
    const row = await findSnapshotRow({ id: scanId });
    if (!row) return null;
    return rowToSnapshot(row, row.normalizedValue);
  } catch (err) {
    if (isPrismaReadSkipped(err)) return null;
    throw err;
  }
}

export async function resolveLatestPublicCheckSnapshotForCheckPage(
  domainLower: string,
  scanId?: string
): Promise<LatestPublicCheckSnapshot | null> {
  const normalized = normalizeDomain(domainLower);
  if (scanId) {
    const byId = await getLatestPublicCheckSnapshotById(scanId);
    if (byId && byId.normalizedValue === normalized) return byId;
  }
  return getLatestPublicCheckSnapshotForDomain(domainLower);
}

/** @deprecated Use {@link resolveLatestPublicCheckSnapshotForCheckPage} — avoids unstable_cache production issues. */
export function getCachedResolveLatestPublicCheckSnapshotForCheckPage(
  domainLower: string,
  scanId?: string
) {
  return resolveLatestPublicCheckSnapshotForCheckPage(domainLower, scanId);
}
