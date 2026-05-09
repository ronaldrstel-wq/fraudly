import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import { buildScamAlertsQuery } from "@/lib/scam-alerts/presentation";

const primaryFilters: Array<{ key: ListFilterKey; label: string; sub?: string }> = [
  { key: "all", label: "All alerts" },
  { key: "high", label: "High risk only", sub: "Confidence-based" },
  { key: "malware", label: "Malware" },
  { key: "phishing", label: "Phishing" },
  { key: "new-today", label: "New today", sub: "UTC day" }
];

type Props = {
  activeFilter: ListFilterKey;
  selectedType: string;
  types: string[];
};

function hrefFor(filter: ListFilterKey, type: string) {
  return `/scam-alerts${buildScamAlertsQuery({ filter: filter === "all" ? undefined : filter, type: type || undefined, page: 1 })}`;
}

export function ScamAlertsFilterBar({ activeFilter, selectedType, types }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter alerts</p>
        <nav aria-label="Primary alert filters" className="mt-2 flex flex-wrap gap-2">
          {primaryFilters.map(({ key, label, sub }) => {
            const active = activeFilter === key;
            return (
              <Link
                key={key}
                href={hrefFor(key, selectedType)}
                scroll={false}
                title={sub}
                className={`flex min-h-[2.75rem] flex-col justify-center rounded-xl border px-3.5 py-2 text-left text-sm font-semibold transition sm:min-w-[8.5rem] ${
                  active
                    ? "border-blue-500 bg-blue-50 text-blue-950 shadow-sm ring-1 ring-blue-200"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
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
          <span className="font-medium text-slate-500">Exact type:</span>
          <Link
            href={hrefFor(activeFilter, "")}
            scroll={false}
            className={`rounded-full border px-2.5 py-1 ${!selectedType ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Any
          </Link>
          {types.map((type) => {
            const active = selectedType === type;
            return (
              <Link
                key={type}
                href={hrefFor(activeFilter, type)}
                scroll={false}
                className={`max-w-[200px] truncate rounded-full border px-2.5 py-1 ${
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
