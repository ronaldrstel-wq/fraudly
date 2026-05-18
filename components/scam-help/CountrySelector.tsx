"use client";

import type { ScamHelpCountrySummary } from "@/lib/scam-help/countries";

type CountrySelectorProps = {
  countries: ScamHelpCountrySummary[];
  value: string;
  onChange: (code: string) => void;
  id?: string;
};

export function CountrySelector({ countries, value, onChange, id = "scam-help-country" }: CountrySelectorProps) {
  const sorted = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="w-full max-w-md">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-900">
        Country or region
      </label>
      <p className="mt-1 text-xs text-slate-600">Your choice is saved only in this browser—we do not send it to our servers.</p>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-blue-500/30 focus:border-blue-400 focus:ring-2"
      >
        <option value="">Choose your country…</option>
        {sorted.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}
