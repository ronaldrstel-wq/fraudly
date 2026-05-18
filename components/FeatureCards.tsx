"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

interface FeatureCardsProps {
  stacked?: boolean;
}

export function FeatureCards({ stacked = false }: FeatureCardsProps) {
  const { dict } = useLocale();
  const cards = dict.homeSections.featureCards;

  return (
    <aside className={stacked ? "space-y-4" : "grid gap-4 md:grid-cols-3"}>
      {cards.map((card) => (
        <article key={card.title} className="fraudly-card border-slate-100 p-5">
          <h3 className="fraudly-marketing-card-title text-base font-semibold leading-snug text-slate-900">{card.title}</h3>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">{card.description}</p>
        </article>
      ))}
    </aside>
  );
}
