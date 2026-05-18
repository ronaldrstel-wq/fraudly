import type { ScamAlertsIndexStats } from "@/lib/scam-alerts/service";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type Props = {
  stats: ScamAlertsIndexStats;
  filteredTotal: number;
  rangeStart: number;
  rangeEnd: number;
  summary: Dictionary["scamAlertsPage"]["summary"];
};

function formatRange(
  summary: Dictionary["scamAlertsPage"]["summary"],
  filteredTotal: number,
  rangeStart: number,
  rangeEnd: number
): string {
  if (filteredTotal === 0) return summary.zeroPublished;
  if (rangeStart === rangeEnd) {
    return summary.rangeSingle.replace("{current}", String(rangeStart)).replace("{total}", String(filteredTotal));
  }
  return summary.rangeSpan
    .replace("{start}", String(rangeStart))
    .replace("{end}", String(rangeEnd))
    .replace("{total}", String(filteredTotal));
}

export function ScamAlertsSummaryStrip({ stats, filteredTotal, rangeStart, rangeEnd, summary }: Props) {
  const rangeLabel = formatRange(summary, filteredTotal, rangeStart, rangeEnd);

  return (
    <section aria-label="Alert summary" className="mt-8 rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle sm:p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{summary.totalPublished}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.total}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{summary.highScore}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.elevatedConfidenceCount}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{summary.newTodayUtc}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{stats.newTodayCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{summary.mostCommonType}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {stats.topScamType ?? "—"}
          </p>
        </div>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-700">
        {summary.showing} <span className="font-semibold text-slate-900">{rangeLabel}</span>
        <span className="text-slate-500"> · {summary.sortByScore}</span>
      </p>
    </section>
  );
}
