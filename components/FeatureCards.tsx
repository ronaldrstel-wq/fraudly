const cards = [
  {
    title: "Advanced AI Analysis",
    description: "Multiple trust and risk signals scored instantly for every link."
  },
  {
    title: "Instant Results",
    description: "Get a clear verdict in seconds with zero setup required."
  },
  {
    title: "Your Safety First",
    description: "Built to help people avoid phishing, fake shops, and scam campaigns."
  }
];

interface FeatureCardsProps {
  stacked?: boolean;
}

export function FeatureCards({ stacked = false }: FeatureCardsProps) {
  return (
    <aside className={stacked ? "space-y-4" : "grid gap-4 md:grid-cols-3"}>
      {cards.map((card) => (
        <article key={card.title} className="rounded-xl bg-white p-5 shadow-lg shadow-slate-200/60">
          <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{card.description}</p>
        </article>
      ))}
    </aside>
  );
}
