import { IntelligenceTile } from "@/components/pulse/IntelligenceTile";
import type { PulseIntelligenceTile } from "@/lib/pulse/types";

export function PulseIntelligenceGrid({ tiles }: { tiles: PulseIntelligenceTile[] }) {
  const featured = tiles.find((t) => t.featured);
  const rest = tiles.filter((t) => !t.featured);

  return (
    <section aria-labelledby="pulse-intelligence-heading">
      <div className="mb-5 max-w-2xl">
        <h2 id="pulse-intelligence-heading" className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
          Live scam intelligence
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Compact signals from recent public checks and published alerts—updated as Fraudly collects more data. Not a
          guarantee that any listed site is unsafe.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <IntelligenceTile {...featured} />
          </div>
        ) : null}
        {rest.map((tile) => (
          <IntelligenceTile key={tile.id} {...tile} />
        ))}
      </div>
    </section>
  );
}
