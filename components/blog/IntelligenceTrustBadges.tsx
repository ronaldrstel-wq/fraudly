import type { IntelligenceCategory } from "@/lib/blog/types";

const BADGES: IntelligenceCategory[] = [
  "Scam Intelligence",
  "Consumer Safety Guide",
  "Fraud Prevention",
  "Threat Awareness"
];

export function IntelligenceTrustBadges({ onDark = false }: { onDark?: boolean }) {
  const itemClass = onDark
    ? "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm"
    : "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.06)]";

  return (
    <ul className="mt-6 flex flex-wrap gap-2" aria-label="Intelligence topics">
      {BADGES.map((label) => (
        <li key={label} className={itemClass}>
          {label}
        </li>
      ))}
    </ul>
  );
}

export function IntelligenceCategoryBadge({ category }: { category: IntelligenceCategory }) {
  return (
    <span className="inline-flex rounded-full border border-blue-300/90 bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-blue-900 shadow-[0_1px_3px_rgba(37,99,235,0.12)]">
      {category}
    </span>
  );
}
