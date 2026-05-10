const cards = [
  {
    title: "Signals, not noise",
    description: "Reputation, scam feeds, SSL, domain story, and wording cues—rolled into one readable view."
  },
  {
    title: "Seconds, not guesswork",
    description: "Runs in the browser instantly. No install, no signup required for your first look."
  },
  {
    title: "Straight talk",
    description: "Plain-language guidance with honest limits—Fraudly augments your judgment; it doesn’t replace it."
  }
];

interface FeatureCardsProps {
  stacked?: boolean;
}

export function FeatureCards({ stacked = false }: FeatureCardsProps) {
  return (
    <aside className={stacked ? "space-y-4" : "grid gap-4 md:grid-cols-3"}>
      {cards.map((card) => (
        <article key={card.title} className="fraudly-card border-slate-100 p-5">
          <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
        </article>
      ))}
    </aside>
  );
}
