import { db } from "@/lib/db";

export type LatestPublicCheckFeedRow = {
  id: string;
  checkedValue: string;
  entityType: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPath: string;
  lastSeenAt: Date;
};

export async function listLatestPublicChecksPage(input: {
  skip: number;
  take: number;
  debugLabel?: string;
}): Promise<LatestPublicCheckFeedRow[]> {
  const totalCount = await db.latestPublicCheck.count();
  const rows = await db.latestPublicCheck.findMany({
    orderBy: { lastSeenAt: "desc" },
    skip: input.skip,
    take: input.take,
    select: {
      id: true,
      checkedValue: true,
      entityType: true,
      riskScoreSnapshot: true,
      statusLabel: true,
      publicResultPath: true,
      lastSeenAt: true
    }
  });

  // Public feed intentionally has no user scoping. Keep this log while validating rollout.
  console.info("[latest-checks] page query", {
    debugLabel: input.debugLabel ?? "default",
    skip: input.skip,
    take: input.take,
    totalCount,
    returnedCount: rows.length
  });

  return rows;
}
