import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LATEST_PUBLIC_CHECKS_CACHE_TAG } from "@/lib/trust/cacheTags";

export function latestChecksCacheBypassEnabled(): boolean {
  return process.env.LATEST_CHECKS_BYPASS_CACHE?.trim().toLowerCase() === "true";
}

/** Columns guaranteed by the original LatestPublicCheck migration (no optional JSON payload). */
export const latestPublicCheckListSelect = {
  id: true,
  normalizedValue: true,
  checkedValue: true,
  entityType: true,
  riskScoreSnapshot: true,
  statusLabel: true,
  publicResultPath: true,
  lastSeenAt: true
} as const;

export const latestPublicCheckListSelectCanonical = {
  ...latestPublicCheckListSelect,
  normalizedTrustScore: true,
  consumerVerdictLabel: true,
  consumerVerdictBand: true
} as const;

export type LatestPublicCheckListRow = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  entityType: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPath: string;
  lastSeenAt: Date;
  normalizedTrustScore?: number | null;
  consumerVerdictLabel?: string | null;
  consumerVerdictBand?: string | null;
};

export type LatestPublicChecksListResult = {
  rows: LatestPublicCheckListRow[];
  /** True when the DB query failed (schema mismatch, connection, etc.) — not “zero rows”. */
  loadFailed: boolean;
};

function logListFetchError(err: unknown, context: string): void {
  const detail =
    err instanceof Prisma.PrismaClientKnownRequestError
      ? { code: err.code, message: err.message, meta: err.meta }
      : err instanceof Error
        ? { name: err.name, message: err.message }
        : { message: String(err) };
  console.error(`[latest-checks] ${context}`, detail);
}

function isMissingColumnError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022";
}

/**
 * Paginated latest-public-check feed for `/latest-checks`.
 * Never throws — returns `{ rows: [], loadFailed: true }` on any DB error.
 */
async function fetchLatestPublicChecksPageInner(
  skip: number,
  take: number
): Promise<LatestPublicChecksListResult> {
  try {
    const rows = await db.latestPublicCheck.findMany({
      orderBy: { lastSeenAt: "desc" },
      skip,
      take,
      select: latestPublicCheckListSelectCanonical
    });
    return { rows, loadFailed: false };
  } catch (err) {
    if (!isMissingColumnError(err)) {
      logListFetchError(err, "list fetch failed");
      return { rows: [], loadFailed: true };
    }
    try {
      const rows = await db.latestPublicCheck.findMany({
        orderBy: { lastSeenAt: "desc" },
        skip,
        take,
        select: latestPublicCheckListSelect
      });
      return { rows, loadFailed: false };
    } catch (fallbackErr) {
      logListFetchError(fallbackErr, "list fetch legacy fallback failed");
      return { rows: [], loadFailed: true };
    }
  }
}

export async function fetchLatestPublicChecksPage(
  skip: number,
  take: number,
  options?: { bypassCache?: boolean }
): Promise<LatestPublicChecksListResult> {
  if (options?.bypassCache || latestChecksCacheBypassEnabled()) {
    return fetchLatestPublicChecksPageInner(skip, take);
  }
  return unstable_cache(
    () => fetchLatestPublicChecksPageInner(skip, take),
    ["latest-public-checks-page", String(skip), String(take)],
    { revalidate: 120, tags: [LATEST_PUBLIC_CHECKS_CACHE_TAG] }
  )();
}

/** Documented cache key shape for pagination debugging. */
export function latestPublicChecksCacheKey(skip: number, take: number): string[] {
  return ["latest-public-checks-page", String(skip), String(take)];
}
