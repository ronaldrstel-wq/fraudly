import type { ScamAlertsIndexStats } from "@/lib/scam-alerts/service";

type Props = {
  stats: ScamAlertsIndexStats;
  /** How many cards match the active filters (subset of loaded list). */
  visibleCount: number;
  /** Total items loaded for this page request (capped). */
  loadedCount: number;
};

export function ScamAlertsSummaryStrip({ stats, visibleCount, loadedCount }: Props) {
  return (
    <section aria-label="Alert summary" className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total published</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">High+ (conf. ≥ 75)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.elevatedConfidenceCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">New today (UTC)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.newTodayCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Most common type</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {stats.topScamType ?? "—"}
          </p>
        </div>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        Showing <span className="font-semibold text-slate-800">{visibleCount}</span> of{" "}
        <span className="font-semibold text-slate-800">{loadedCount}</span> loaded alerts (newest first). Totals cover all
        published alerts in the database.
      </p>
    </section>
  );
}
