import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

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

export type LatestPublicCheckListRow = {
  id: string;
  normalizedValue: string;
  checkedValue: string;
  entityType: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPath: string;
  lastSeenAt: Date;
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

/**
 * Paginated latest-public-check feed for `/latest-checks`.
 * Never throws — returns `{ rows: [], loadFailed: true }` on any DB error.
 */
export async function fetchLatestPublicChecksPage(
  skip: number,
  take: number
): Promise<LatestPublicChecksListResult> {
  try {
    const rows = await db.latestPublicCheck.findMany({
      orderBy: { lastSeenAt: "desc" },
      skip,
      take,
      select: latestPublicCheckListSelect
    });
    return { rows, loadFailed: false };
  } catch (err) {
    logListFetchError(err, "list fetch failed");
    return { rows: [], loadFailed: true };
  }
}
