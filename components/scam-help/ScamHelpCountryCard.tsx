import Link from "next/link";
import type { ScamHelpCountry } from "@/lib/scam-help/countries";
import { scamHelpCountryPath } from "@/lib/scam-help/countries";

export function ScamHelpCountryCard({ country }: { country: ScamHelpCountry }) {
  if (!country.detail) return null;

  return (
    <Link
      href={scamHelpCountryPath(country.slug)}
      className="group flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60 transition hover:border-blue-200/80 hover:shadow-xl hover:shadow-blue-100/40 sm:p-6"
    >
      <div className="mb-3 flex items-center gap-3">
        <span
          className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold tracking-wide text-slate-700"
          aria-hidden
        >
          {country.code}
        </span>
        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">{country.name}</h2>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-600">{country.detail.description}</p>
      <span className="mt-4 text-sm font-semibold text-blue-600 group-hover:underline">
        View guidance →
      </span>
    </Link>
  );
}
