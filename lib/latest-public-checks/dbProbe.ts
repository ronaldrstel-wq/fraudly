import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";
import {
  latestPublicCheckListSelect,
  latestPublicCheckListSelectCanonical
} from "@/lib/latest-public-checks/listPublicChecks";

export type LatestChecksDbProbe = {
  connected: boolean;
  connectionError: string | null;
  latestPublicCheckCount: number | null;
  scamSignalCount: number | null;
  reputationCacheCount: number | null;
  newestLastSeenAt: string | null;
  oldestLastSeenAt: string | null;
  sampleRows: LatestPublicCheckListRow[];
  canonicalSelectWorks: boolean;
  legacySelectWorks: boolean;
};

export async function probeLatestChecksDatabase(take = 10): Promise<LatestChecksDbProbe> {
  const empty: LatestChecksDbProbe = {
    connected: false,
    connectionError: null,
    latestPublicCheckCount: null,
    scamSignalCount: null,
    reputationCacheCount: null,
    newestLastSeenAt: null,
    oldestLastSeenAt: null,
    sampleRows: [],
    canonicalSelectWorks: false,
    legacySelectWorks: false
  };

  try {
    const [count, scamCount, cacheCount, agg] = await Promise.all([
      db.latestPublicCheck.count(),
      db.scamSignal.count().catch(() => null),
      db.reputationEnrichmentCache.count().catch(() => null),
      db.latestPublicCheck.aggregate({
        _max: { lastSeenAt: true },
        _min: { lastSeenAt: true }
      })
    ]);

    let canonicalSelectWorks = false;
    let legacySelectWorks = false;
    let sampleRows: LatestPublicCheckListRow[] = [];

    try {
      sampleRows = await db.latestPublicCheck.findMany({
        orderBy: { lastSeenAt: "desc" },
        take,
        select: latestPublicCheckListSelectCanonical
      });
      canonicalSelectWorks = true;
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2022")) {
        throw err;
      }
      sampleRows = await db.latestPublicCheck.findMany({
        orderBy: { lastSeenAt: "desc" },
        take,
        select: latestPublicCheckListSelect
      });
      legacySelectWorks = true;
    }

    if (canonicalSelectWorks) legacySelectWorks = true;

    return {
      connected: true,
      connectionError: null,
      latestPublicCheckCount: count,
      scamSignalCount: scamCount,
      reputationCacheCount: cacheCount,
      newestLastSeenAt: agg._max.lastSeenAt?.toISOString() ?? null,
      oldestLastSeenAt: agg._min.lastSeenAt?.toISOString() ?? null,
      sampleRows,
      canonicalSelectWorks,
      legacySelectWorks
    };
  } catch (error) {
    return {
      ...empty,
      connectionError: error instanceof Error ? error.message : String(error)
    };
  }
}
