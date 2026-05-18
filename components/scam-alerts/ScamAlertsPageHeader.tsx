"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

export function ScamAlertsPageHeader() {
  const { dict } = useLocale();
  const t = dict.scamAlerts;

  return (
    <header className="max-w-3xl">
      <p className="text-sm font-medium text-blue-700">{t.eyebrow}</p>
      <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">{t.title}</h1>
      <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-slate-600">{t.intro}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700 sm:text-sm">
        {t.chips.map((chip) => (
          <span key={chip} className="max-w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 text-center leading-snug shadow-sm">
            {chip}
          </span>
        ))}
      </div>
      <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-600">{t.chipHint}</p>
      <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
        {t.disclaimer}
      </p>
    </header>
  );
}
