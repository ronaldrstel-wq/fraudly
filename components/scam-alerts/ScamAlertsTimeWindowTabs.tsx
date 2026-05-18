import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedScamAlertsHref } from "@/lib/i18n/scam-alerts-path";
import type { Locale } from "@/lib/i18n/locales";

type Props = {
  locale: Locale;
  active: ScamAlertsTimeWindow;
  filter: ListFilterKey;
  selectedType: string;
};

export function ScamAlertsTimeWindowTabs({ locale, active, filter, selectedType }: Props) {
  const { scamAlertsPage: ui } = getDictionary(locale);
  const tabs: Array<{ key: ScamAlertsTimeWindow; label: string; hint: string }> = [
    { key: "today", label: ui.timeRange.today, hint: ui.timeRange.todayHint },
    { key: "24h", label: ui.timeRange.last24h, hint: ui.timeRange.last24hHint },
    { key: "7d", label: ui.timeRange.last7d, hint: ui.timeRange.last7dHint },
    { key: "all", label: ui.timeRange.allAlerts, hint: ui.timeRange.allAlertsHint }
  ];

  return (
    <div className="rounded-2xl border border-slate-200/85 bg-white p-3 shadow-subtle sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ui.timeRange.label}</p>
      <nav className="mt-2 flex flex-wrap gap-1.5 sm:gap-2" aria-label="Alert time range">
        {tabs.map(({ key, label, hint }) => {
          const isActive = active === key;
          return (
            <Link
              key={key}
              href={localizedScamAlertsHref({ locale, time: key, filter, type: selectedType })}
              scroll={false}
              title={hint}
              aria-current={isActive ? "true" : undefined}
              className={`fraudly-focus min-h-10 max-w-full rounded-xl border px-2.5 py-2 text-center text-xs font-semibold leading-snug sm:min-h-0 sm:px-3 sm:text-sm ${
                isActive
                  ? "border-blue-600/95 bg-blue-600 text-white shadow-subtle"
                  : "border-slate-200/90 bg-slate-50 text-slate-800 hover:border-slate-300/90 hover:bg-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-2 text-pretty text-xs text-slate-500">{ui.timeRange.helper}</p>
    </div>
  );
}
