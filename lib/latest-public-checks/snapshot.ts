import { normalizeDomain } from "@/lib/cache";
import { parsePublicResultPayload } from "@/lib/trust/canonicalTrustBridge";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { consumerDisplayBand } from "@/lib/scoring/trust-bands";
import {
  logDisplayScoreDebug,
  normalizeRiskScore,
  publicDisplayScoreFromLatestRow,
  type PublicDisplayScore
} from "@/lib/scoring/displayScore";
import { enrichScamCheckResultDomainAge } from "@/lib/domain/normalizeDomainAge";
import type { CanonicalTrustFields } from "@/lib/trust/canonicalTrustBridge";
import { resolveCanonicalFromPersistedColumns } from "@/lib/trust/resolveCanonicalDisplay";
import type { NormalizedTrustResult } from "@/lib/trust/types";
import type { ScamCheckResult, ScamVerdict } from "@/types/scam";

export type SnapshotCanonicalTrust = CanonicalTrustFields;

export type LatestPublicCheckSnapshot = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  lastSeenAt: Date;
  display: PublicDisplayScore & { scanId: string };
  /** Persisted canonical fields when migration columns exist. */
  canonical: SnapshotCanonicalTrust | null;
  storedResult: ScamCheckResult | null;
  storedNormalized: NormalizedTrustResult | null;
  /** @deprecated Backwards-compatible metadata only — do not use for UX. */
  statusLabel: string;
};

type SnapshotRowBase = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  lastSeenAt: Date;
  consumerVerdict?: string | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
  normalizedTrustScore?: number | null;
  normalizedRiskScore?: number | null;
  publicResultPayload?: unknown;
};

const snapshotSelectBase = {
  id: true,
  normalizedValue: true,
  checkedValue: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  lastSeenAt: true,
  consumerVerdict: true,
  consumerVerdictLabel: true,
  consumerVerdictBand: true,
  normalizedTrustScore: true,
  normalizedRiskScore: true
} as const;

const snapshotSelectLegacy = {
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

function canonicalFromRow(row: SnapshotRowBase): SnapshotCanonicalTrust | null {
  const hasTrust =
    row.normalizedTrustScore != null && Number.isFinite(row.normalizedTrustScore);
  const hasRisk = row.normalizedRiskScore != null && Number.isFinite(row.normalizedRiskScore);
  if (!hasTrust && !hasRisk) return null;

  return resolveCanonicalFromPersistedColumns({
    riskScoreSnapshot: row.riskScoreSnapshot,
    normalizedTrustScore: row.normalizedTrustScore,
    normalizedRiskScore: row.normalizedRiskScore,
    consumerVerdictLabel: row.consumerVerdictLabel,
    consumerVerdictBand: row.consumerVerdictBand,
    consumerVerdict: row.consumerVerdict as ScamVerdict | null | undefined
  });
}

function displayFromRow(row: SnapshotRowBase, canonical: SnapshotCanonicalTrust | null): PublicDisplayScore & { scanId: string } {
  if (canonical) {
    return {
      riskScore: normalizeRiskScore(canonical.riskScore),
      trustScore: canonical.trustScore,
      band: consumerDisplayBand(canonical.trustScore),
      label: canonical.consumerVerdictLabel,
      verdict: canonical.consumerVerdict,
      scanId: row.id
    };
  }
  return publicDisplayScoreFromLatestRow(row);
}

function rowToSnapshot(row: SnapshotRowBase, domainLower: string): LatestPublicCheckSnapshot {
  const canonical = canonicalFromRow(row);
  const display = displayFromRow(row, canonical);

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
    ? parsePublicResultPayload(row.publicResultPayload, domainLower)
    : null;

  const storedResult = parsedPayload?.result
    ? enrichScamCheckResultDomainAge(parsedPayload.result)
    : null;

  const storedNormalized = parsedPayload?.normalizedTrustResult ?? null;

  return {
    id: row.id,
    normalizedValue: row.normalizedValue,
    checkedValue: row.checkedValue,
    lastSeenAt: row.lastSeenAt,
    display,
    canonical,
    storedResult,
    storedNormalized: storedNormalized ?? null,
    statusLabel: row.statusLabel
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
      const row = await db.latestPublicCheck.findUnique({
        where,
        select: { ...snapshotSelectLegacy, publicResultPayload: true }
      });
      return row;
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
