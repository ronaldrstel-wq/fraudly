import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";
import { buildScamAlertsQuery } from "@/lib/scam-alerts/presentation";

const TABS: Array<{ key: ScamAlertsTimeWindow; label: string; hint: string }> = [
  { key: "today", label: "Today", hint: "Published since midnight UTC today" },
  { key: "24h", label: "Last 24h", hint: "Rolling last 24 hours" },
  { key: "7d", label: "Last 7 days", hint: "Rolling last seven days" },
  { key: "all", label: "All alerts", hint: "Every published alert in view" }
];

type Props = {
  active: ScamAlertsTimeWindow;
  filter: ListFilterKey;
  selectedType: string;
};

function href(time: ScamAlertsTimeWindow, filter: ListFilterKey, type: string) {
  return `/scam-alerts${buildScamAlertsQuery({
    time,
    filter: filter === "all" ? undefined : filter,
    type: type || undefined,
    page: 1
  })}`;
}

export function ScamAlertsTimeWindowTabs({ active, filter, selectedType }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time range</p>
      <nav className="mt-2 flex flex-wrap gap-1.5 sm:gap-2" aria-label="Alert time range">
        {TABS.map(({ key, label, hint }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={href(key, filter, selectedType)}
              scroll={false}
              title={hint}
              aria-current={isActive ? "true" : undefined}
              className={`min-h-[2.5rem] rounded-lg border px-2.5 py-2 text-center text-xs font-semibold transition sm:min-h-0 sm:px-3 sm:text-sm ${
                isActive
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-2 text-xs text-slate-500">Default is Today (UTC). Selection is kept in the URL.</p>
    </div>
  );
}
