import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { PublicLatestScanContract } from "@/lib/public-feed/contract";

export type PublicLatestFeedRow = {
  id: string;
  checkedValue: string;
  entityType: string;
  riskScoreSnapshot: number;
  statusLabel: string;
  publicResultPath: string;
  lastSeenAt: Date;
};

export async function getPublicLatestScans(input: {
  skip: number;
  take: number;
  debugLabel?: string;
}): Promise<PublicLatestFeedRow[]> {
  const skip = Math.max(0, Math.floor(input.skip));
  const take = Math.max(1, Math.floor(input.take));

  const totalCountRows = await db.$queryRaw<Array<{ totalCount: bigint | number }>>`
    SELECT COUNT(*)::bigint AS "totalCount"
    FROM "public_latest_scans_view"
  `;

  const rows = await db.$queryRaw<PublicLatestScanContract[]>(Prisma.sql`
    SELECT
      "id",
      "normalizedValue",
      "entityType",
      "status",
      "score",
      "publicResultPath",
      "createdAt"
    FROM "public_latest_scans_view"
    ORDER BY "createdAt" DESC
    LIMIT ${take}
    OFFSET ${skip}
  `);

  const totalCount = Number(totalCountRows[0]?.totalCount ?? 0);

  console.info("[latest-checks] public feed view query", {
    debugLabel: input.debugLabel ?? "default",
    skip,
    take,
    totalCount,
    returnedCount: rows.length
  });

  return rows.map((row) => ({
    id: row.id,
    checkedValue: row.normalizedValue,
    entityType: row.entityType,
    riskScoreSnapshot: 100 - Math.max(0, Math.min(100, row.score)),
    statusLabel: row.status,
    publicResultPath: row.publicResultPath,
    lastSeenAt: new Date(row.createdAt)
  }));
}
