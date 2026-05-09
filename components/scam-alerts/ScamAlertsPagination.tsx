import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import { buildScamAlertsQuery } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";

type Props = {
  filter: ListFilterKey;
  time: ScamAlertsTimeWindow;
  selectedType: string;
  page: number;
  maxPage: number;
};

function href(page: number, filter: ListFilterKey, type: string, time: ScamAlertsTimeWindow) {
  return `/scam-alerts${buildScamAlertsQuery({
    time,
    filter: filter === "all" ? undefined : filter,
    type: type || undefined,
    page
  })}`;
}

export function ScamAlertsPagination({ filter, time, selectedType, page, maxPage }: Props) {
  if (maxPage <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < maxPage ? page + 1 : null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6" aria-label="Pagination">
      <div>
        {prevPage ? (
          <Link
            rel="prev"
            href={href(prevPage, filter, selectedType, time)}
            scroll={false}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            ← Previous
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed rounded-xl border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
            ← Previous
          </span>
        )}
      </div>
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
        <span className="font-semibold text-slate-900">{maxPage}</span>
      </p>
      <div>
        {nextPage ? (
          <Link
            rel="next"
            href={href(nextPage, filter, selectedType, time)}
            scroll={false}
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            Next →
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed rounded-xl border border-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}
