import { unstable_cache } from "next/cache";
import { normalizeDomain } from "@/lib/cache";
import { parseStoredPublicResultPayload } from "@/lib/check/parseStoredPublicResultPayload";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  logDisplayScoreDebug,
  publicDisplayScoreFromLatestRow,
  type PublicDisplayScore
} from "@/lib/scoring/displayScore";
import type { ScamCheckResult } from "@/types/scam";

export type LatestPublicCheckSnapshot = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  lastSeenAt: Date;
  display: PublicDisplayScore & { scanId: string };
  /** Parsed stored scan when `publicResultPayload` is present (instant detail paint). */
  storedResult: ScamCheckResult | null;
};

type LatestPublicCheckRow = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  lastSeenAt: Date;
  publicResultPayload: unknown;
};

function rowToSnapshot(row: LatestPublicCheckRow, domainLower: string): LatestPublicCheckSnapshot {
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

  return {
    id: row.id,
    normalizedValue: row.normalizedValue,
    checkedValue: row.checkedValue,
    lastSeenAt: row.lastSeenAt,
    display,
    storedResult: parseStoredPublicResultPayload(row.publicResultPayload, domainLower)
  };
}

const snapshotSelect = {
  id: true,
  normalizedValue: true,
  checkedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  lastSeenAt: true,
  publicResultPayload: true
} as const;

function isPrismaReadSkipped(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    (err.code === "P2021" || err.code === "P1001")
  );
}

/**
 * Loads the anonymized public feed snapshot for a hostname (same row as `/latest-checks`).
 */
export async function getLatestPublicCheckSnapshotForDomain(
  domainLower: string
): Promise<LatestPublicCheckSnapshot | null> {
  const normalizedValue = normalizeDomain(domainLower);
  try {
    const row = await db.latestPublicCheck.findUnique({
      where: { normalizedValue },
      select: snapshotSelect
    });
    if (!row) return null;
    return rowToSnapshot(row, domainLower);
  } catch (err) {
    if (isPrismaReadSkipped(err)) return null;
    throw err;
  }
}

/** Loads a specific latest-public-check row (e.g. from `?scanId=` on a latest card). */
export async function getLatestPublicCheckSnapshotById(
  scanId: string
): Promise<LatestPublicCheckSnapshot | null> {
  try {
    const row = await db.latestPublicCheck.findUnique({
      where: { id: scanId },
      select: snapshotSelect
    });
    if (!row) return null;
    return rowToSnapshot(row, row.normalizedValue);
  } catch (err) {
    if (isPrismaReadSkipped(err)) return null;
    throw err;
  }
}

/**
 * Resolves snapshot for a check page: prefers `scanId` when it matches the domain.
 */
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

const SNAPSHOT_CACHE_SECONDS = 60;

export function getCachedLatestPublicCheckSnapshotForDomain(domainLower: string) {
  return unstable_cache(
    async () => getLatestPublicCheckSnapshotForDomain(domainLower),
    ["latest-public-check-snapshot", normalizeDomain(domainLower)],
    { revalidate: SNAPSHOT_CACHE_SECONDS }
  )();
}

export function getCachedLatestPublicCheckSnapshotById(scanId: string) {
  return unstable_cache(
    async () => getLatestPublicCheckSnapshotById(scanId),
    ["latest-public-check-snapshot-id", scanId],
    { revalidate: SNAPSHOT_CACHE_SECONDS }
  )();
}

export function getCachedResolveLatestPublicCheckSnapshotForCheckPage(
  domainLower: string,
  scanId?: string
) {
  const key = scanId
    ? ["latest-public-check-resolve", normalizeDomain(domainLower), scanId]
    : ["latest-public-check-resolve", normalizeDomain(domainLower)];
  return unstable_cache(
    async () => resolveLatestPublicCheckSnapshotForCheckPage(domainLower, scanId),
    key,
    { revalidate: SNAPSHOT_CACHE_SECONDS }
  )();
}
