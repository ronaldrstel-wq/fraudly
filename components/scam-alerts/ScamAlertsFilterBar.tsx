import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import type { ScamAlertsTimeWindow } from "@/lib/scam-alerts/service";
import { ScamAlertsTimeWindowTabs } from "@/components/scam-alerts/ScamAlertsTimeWindowTabs";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedScamAlertsHref } from "@/lib/i18n/scam-alerts-path";
import type { Locale } from "@/lib/i18n/locales";

type Props = {
  locale: Locale;
  activeFilter: ListFilterKey;
  activeTime: ScamAlertsTimeWindow;
  selectedType: string;
  types: string[];
};

export function ScamAlertsFilterBar({ locale, activeFilter, activeTime, selectedType, types }: Props) {
  const { scamAlertsPage: ui } = getDictionary(locale);

  const primaryFilters: Array<{ key: ListFilterKey; label: string; sub?: string }> = [
    { key: "all", label: ui.filters.allSeverities },
    { key: "high", label: ui.filters.highRiskOnly, sub: ui.filters.highRiskSub },
    { key: "malware", label: ui.filters.malware },
    { key: "phishing", label: ui.filters.phishing }
  ];

  return (
    <div className="space-y-4">
      <ScamAlertsTimeWindowTabs
        locale={locale}
        active={activeTime}
        filter={activeFilter}
        selectedType={selectedType}
      />

      <div className="rounded-2xl border border-slate-200/85 bg-white/90 p-3.5 shadow-subtle backdrop-blur-sm sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{ui.filters.severityTypeLabel}</p>
        <nav aria-label="Alert severity filters" className="mt-2 flex flex-wrap gap-2">
          {primaryFilters.map(({ key, label, sub }) => {
            const active = activeFilter === key;
            return (
              <Link
                key={key}
                href={localizedScamAlertsHref({ locale, time: activeTime, filter: key, type: selectedType })}
                scroll={false}
                title={sub}
                className={`fraudly-focus flex min-h-11 max-w-full flex-col justify-center rounded-xl border px-3.5 py-2 text-left text-sm font-semibold leading-snug sm:min-w-[8.5rem] ${
                  active
                    ? "border-blue-400/90 bg-blue-50/95 text-blue-900 shadow-subtle ring-1 ring-blue-100/80"
                    : "border-slate-200/90 bg-white text-slate-800 hover:border-slate-300/90 hover:bg-slate-50"
                }`}
              >
                <span>{label}</span>
                {sub ? <span className="mt-0.5 text-[11px] font-normal text-slate-500">{sub}</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {types.length > 0 ? (
        <nav aria-label="Browse by exact alert type" className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-500">{ui.filters.exactTypeLabel}</span>
          <Link
            href={localizedScamAlertsHref({ locale, time: activeTime, filter: activeFilter })}
            scroll={false}
            className={`rounded-full border px-2.5 py-1 ${!selectedType ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            {ui.filters.anyType}
          </Link>
          {types.map((type) => {
            const active = selectedType === type;
            return (
              <Link
                key={type}
                href={localizedScamAlertsHref({ locale, time: activeTime, filter: activeFilter, type })}
                scroll={false}
                className={`max-w-[min(100%,12rem)] truncate rounded-full border px-2.5 py-1 ${
                  active ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
                title={type}
              >
                {type}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
