import type { DataConfidenceBadgeModel } from "@/lib/trust/dataConfidence";

const TONE: Record<DataConfidenceBadgeModel["indicator"], string> = {
  verified: "border-emerald-200/90 bg-emerald-50/90 text-emerald-900",
  limited: "border-amber-200/85 bg-amber-50/85 text-amber-950",
  stale: "border-slate-200 bg-slate-50 text-slate-700",
  unavailable: "border-slate-200 bg-slate-50/80 text-slate-600",
  conflicting: "border-orange-200/90 bg-orange-50/90 text-orange-950"
};

/** Compact, non-alarming transparency badge for trust data sources. */
export function TrustDataConfidenceBadge({ badge }: { badge: DataConfidenceBadgeModel }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-tight ${TONE[badge.indicator]}`}
      title={badge.title}
    >
      {badge.label}
    </span>
  );
}

export function TrustDataConfidenceBadgeRow({
  badges,
  ariaLabel = "Data confidence"
}: {
  badges: DataConfidenceBadgeModel[];
  ariaLabel?: string;
}) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label={ariaLabel}>
      {badges.map((badge) => (
        <span key={`${badge.indicator}-${badge.label}`} role="listitem">
          <TrustDataConfidenceBadge badge={badge} />
        </span>
      ))}
    </div>
  );
}
