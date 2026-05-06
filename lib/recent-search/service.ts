import { normalizeDomain } from "@/lib/cache";
import type { RecentSearch as RecentSearchRow } from "@prisma/client";
import { db } from "@/lib/db";
import type { ScamCheckResult } from "@/types/scam";
import { CLEAR_ALL_CONFIRM_BODY, RECENT_SEARCH_DEDUPE_MS } from "@/lib/recent-search/constants";

export type RecentSearchPublic = {
  id: string;
  originalQuery: string;
  normalizedQuery: string;
  entityType: string;
  trustScoreSnap: number | null;
  verdictSnap: string | null;
  resultPath: string;
  createdAt: string;
};

function toPublic(row: RecentSearchRow): RecentSearchPublic {
  return {
    id: row.id,
    originalQuery: row.originalQuery,
    normalizedQuery: row.normalizedQuery,
    entityType: row.entityType,
    trustScoreSnap: row.trustScoreSnap ?? null,
    verdictSnap: row.verdictSnap ?? null,
    resultPath: row.resultPath,
    createdAt: row.createdAt.toISOString()
  };
}

export function inferEntityTypeFromUrl(_parsedHref: string): string {
  void _parsedHref;
  return "domain";
}

function truncateOriginal(q: string): string {
  return q.length > 8000 ? q.slice(0, 8000) : q;
}

function truncateNormalized(q: string): string {
  return q.length > 2048 ? q.slice(0, 2048) : q;
}

/** Record a snapshot after a successful `/api/check`; dedupes accidental double-writes within a short window. */
export async function tryRecordRecentSearch(input: {
  userId: string | null;
  anonymousSessionKey: string | null;
  originalUrlInput: string;
  analyzedHref: string;
  result: ScamCheckResult;
}): Promise<void> {
  const originalQuery = truncateOriginal(input.originalUrlInput.trim());
  const normalizedQuery = truncateNormalized(normalizeDomain(input.analyzedHref));
  const entityType = inferEntityTypeFromUrl(input.analyzedHref);
  const trustScoreSnap = Math.round(100 - input.result.score);
  const verdictSnap = input.result.verdict ?? null;
  const resultPath = `/check/${encodeURIComponent(input.result.domain)}`;

  if (!input.userId && !input.anonymousSessionKey) {
    return;
  }

  const dedupeCutoff = new Date(Date.now() - RECENT_SEARCH_DEDUPE_MS);

  const dup = await db.recentSearch.findFirst({
    where: {
      normalizedQuery,
      createdAt: { gte: dedupeCutoff },
      ...(input.userId
        ? { userId: input.userId, anonymousSessionKey: null }
        : { anonymousSessionKey: input.anonymousSessionKey!, userId: null })
    },
    select: { id: true }
  });

  if (dup) return;

  await db.recentSearch.create({
    data: {
      userId: input.userId,
      anonymousSessionKey: input.userId ? null : input.anonymousSessionKey,
      originalQuery,
      normalizedQuery,
      entityType,
      trustScoreSnap,
      verdictSnap,
      resultPath
    }
  });
}

export async function listRecentSearchesForScope(input: {
  userId: string | null;
  anonymousSessionKey: string | null;
}): Promise<RecentSearchPublic[]> {
  let rows: RecentSearchRow[] = [];

  try {
    if (input.userId) {
      rows = await db.recentSearch.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        take: 200
      });
    } else if (input.anonymousSessionKey) {
      rows = await db.recentSearch.findMany({
        where: { anonymousSessionKey: input.anonymousSessionKey, userId: null },
        orderBy: { createdAt: "desc" },
        take: 200
      });
    }
  } catch (e) {
    // Fail-safe: recent-searches should never crash the whole page.
    console.error("[recent-searches] list failed", e);
    return [];
  }

  return rows.map(toPublic);
}

export async function deleteRecentSearchForScope(rowId: string, scope: { userId: string | null; anonymousSessionKey: string | null }): Promise<boolean> {
  try {
    const row = await db.recentSearch.findUnique({ where: { id: rowId } });
    if (!row) return false;

    if (scope.userId) {
      if (row.userId !== scope.userId) return false;
    } else {
      if (!scope.anonymousSessionKey || row.anonymousSessionKey !== scope.anonymousSessionKey || row.userId != null) {
        return false;
      }
    }

    await db.recentSearch.delete({ where: { id: rowId } });
    return true;
  } catch (e) {
    console.error("[recent-searches] delete failed", e);
    return false;
  }
}

export async function deleteAllRecentSearchesForScope(scope: { userId: string | null; anonymousSessionKey: string | null }): Promise<number> {
  try {
    if (scope.userId) {
      const res = await db.recentSearch.deleteMany({ where: { userId: scope.userId } });
      return res.count;
    }
    if (!scope.anonymousSessionKey) return 0;

    const res = await db.recentSearch.deleteMany({
      where: { anonymousSessionKey: scope.anonymousSessionKey, userId: null }
    });
    return res.count;
  } catch (e) {
    console.error("[recent-searches] clear failed", e);
    return 0;
  }
}

export function validateClearAllBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return o.confirm === CLEAR_ALL_CONFIRM_BODY;
}
