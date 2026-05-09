import Link from "next/link";
import type { ListFilterKey } from "@/lib/scam-alerts/presentation";
import { buildScamAlertsQuery } from "@/lib/scam-alerts/presentation";

const primaryFilters: Array<{ key: ListFilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High risk" },
  { key: "phishing", label: "Phishing" },
  { key: "malware", label: "Malware" },
  { key: "new-today", label: "New today" }
];

type Props = {
  activeFilter: ListFilterKey;
  selectedType: string;
  /** Distinct scam types from the database for secondary browse chips. */
  types: string[];
};

function hrefFor(filter: ListFilterKey, type: string): string {
  return `/scam-alerts${buildScamAlertsQuery({ filter: filter === "all" ? undefined : filter, type: type || undefined })}`;
}

export function ScamAlertsFilterBar({ activeFilter, selectedType, types }: Props) {
  return (
    <div className="space-y-4">
      <nav aria-label="Alert filters" className="flex flex-wrap gap-2">
        {primaryFilters.map(({ key, label }) => {
          const active = activeFilter === key;
          return (
            <Link
              key={key}
              href={hrefFor(key, selectedType)}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "border-blue-400 bg-blue-50 text-blue-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {types.length > 0 ? (
        <nav aria-label="Browse by exact alert type" className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-500">Types:</span>
          <Link
            href={hrefFor(activeFilter, "")}
            scroll={false}
            className={`rounded-full border px-2.5 py-1 ${!selectedType ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            Any type
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
