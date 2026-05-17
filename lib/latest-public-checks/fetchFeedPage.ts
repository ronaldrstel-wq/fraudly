import {
  assessLatestCheckRowRenderable,
  type LatestCheckRowSkipReason
} from "@/lib/latest-public-checks/rowRender";
import {
  fetchLatestPublicChecksPage,
  type LatestPublicCheckListRow
} from "@/lib/latest-public-checks/listPublicChecks";

export type LatestChecksFeedPageResult = {
  rows: LatestPublicCheckListRow[];
  loadFailed: boolean;
  hasNext: boolean;
  page: number;
  pageSize: number;
  skip: number;
  dbRowsScanned: number;
  skipped: Array<{ id: string; reason: LatestCheckRowSkipReason; detail?: string }>;
};

const MAX_DB_SCAN_MULTIPLIER = 8;

/**
 * Fetches a feed page of renderable latest-check rows.
 * Skips invalid newest rows and scans forward until the page is filled or DB is exhausted.
 */
export async function fetchLatestPublicChecksFeedPage(
  page: number,
  pageSize: number,
  options?: { bypassCache?: boolean }
): Promise<LatestChecksFeedPageResult> {
  const safePage = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const safeSize = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 10;
  const targetSkip = (safePage - 1) * safeSize;
  const needRenderable = safeSize + 1;
  const maxDbRows = safeSize * MAX_DB_SCAN_MULTIPLIER + needRenderable;

  const renderable: LatestPublicCheckListRow[] = [];
  const skipped: LatestChecksFeedPageResult["skipped"] = [];
  let dbSkip = targetSkip;
  let dbRowsScanned = 0;
  let loadFailed = false;
  let exhausted = false;

  while (renderable.length < needRenderable && dbRowsScanned < maxDbRows) {
    const remaining = maxDbRows - dbRowsScanned;
    const take = Math.min(safeSize * 2, remaining);
    const batch = await fetchLatestPublicChecksPage(dbSkip, take, options);
    if (batch.loadFailed) {
      loadFailed = true;
      break;
    }
    if (batch.rows.length === 0) {
      exhausted = true;
      break;
    }

    dbRowsScanned += batch.rows.length;
    dbSkip += batch.rows.length;

    for (const row of batch.rows) {
      const assessed = assessLatestCheckRowRenderable(row);
      if (assessed.renderable) {
        renderable.push(assessed.row);
        if (renderable.length >= needRenderable) break;
      } else if (assessed.reason) {
        skipped.push({
          id: row.id ?? "unknown",
          reason: assessed.reason,
          detail: assessed.detail
        });
      }
    }

    if (batch.rows.length < take) {
      exhausted = true;
      break;
    }
  }

  const hasNext = !loadFailed && renderable.length > safeSize;

  return {
    rows: renderable.slice(0, safeSize),
    loadFailed,
    hasNext,
    page: safePage,
    pageSize: safeSize,
    skip: targetSkip,
    dbRowsScanned,
    skipped
  };
}
