import type { PulseIntelligenceAccent, PulseReliability } from "@/lib/pulse/types";

const ACCENT_STYLES: Record<
  PulseIntelligenceAccent,
  { ring: string; iconBg: string; iconText: string; featuredBorder: string }
> = {
  blue: {
    ring: "ring-blue-100/80",
    iconBg: "bg-gradient-to-br from-blue-50 to-blue-100/80",
    iconText: "text-blue-700",
    featuredBorder: "border-blue-200/90"
  },
  amber: {
    ring: "ring-amber-100/80",
    iconBg: "bg-gradient-to-br from-amber-50 to-amber-100/80",
    iconText: "text-amber-800",
    featuredBorder: "border-amber-200/90"
  },
  rose: {
    ring: "ring-rose-100/80",
    iconBg: "bg-gradient-to-br from-rose-50 to-rose-100/80",
    iconText: "text-rose-700",
    featuredBorder: "border-rose-200/90"
  },
  violet: {
    ring: "ring-violet-100/80",
    iconBg: "bg-gradient-to-br from-violet-50 to-violet-100/80",
    iconText: "text-violet-700",
    featuredBorder: "border-violet-200/90"
  },
  emerald: {
    ring: "ring-emerald-100/80",
    iconBg: "bg-gradient-to-br from-emerald-50 to-emerald-100/80",
    iconText: "text-emerald-800",
    featuredBorder: "border-emerald-200/90"
  },
  slate: {
    ring: "ring-slate-200/80",
    iconBg: "bg-gradient-to-br from-slate-50 to-slate-100",
    iconText: "text-slate-700",
    featuredBorder: "border-slate-200/90"
  }
};

function reliabilityChip(level: PulseReliability) {
  if (level === "reliable") return "border-emerald-200/90 bg-emerald-50 text-emerald-800";
  if (level === "limited") return "border-amber-200/90 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function reliabilityLabel(level: PulseReliability) {
  if (level === "reliable") return "Reliable";
  if (level === "limited") return "Early trend";
  return "Limited sample";
}

function valueIsLongForm(value: string): boolean {
  if (value === "—") return false;
  if (value.includes("Not enough")) return true;
  if (value.length > 16) return true;
  return /\s/.test(value) && value.length > 8;
}

type IntelligenceTileProps = {
  title: string;
  value: string;
  explanation: string;
  reliability: PulseReliability;
  confidenceNote: string;
  accent: PulseIntelligenceAccent;
  featured?: boolean;
};

export function IntelligenceTile({
  title,
  value,
  explanation,
  reliability,
  confidenceNote,
  accent,
  featured = false
}: IntelligenceTileProps) {
  const styles = ACCENT_STYLES[accent];
  const longValue = valueIsLongForm(value);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 sm:p-5 ${
        featured
          ? `border-2 ${styles.featuredBorder} bg-gradient-to-br from-white via-white to-blue-50/30 shadow-[0_12px_40px_rgba(59,130,246,0.08)] ${styles.ring}`
          : `border-slate-200/70 ${styles.ring}`
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-balance text-sm font-semibold leading-snug text-slate-900">{title}</p>
        {featured ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.iconBg} ${styles.iconText}`}
          >
            Today
          </span>
        ) : (
          <span
            className={`inline-flex h-2 w-2 shrink-0 rounded-full ${styles.iconBg} ring-2 ${styles.ring}`}
            aria-hidden
          />
        )}
      </header>

      <p
        className={
          longValue
            ? "mt-3 text-[0.95rem] font-semibold leading-snug tracking-tight text-slate-800"
            : "mt-3 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-[1.65rem]"
        }
      >
        {value}
      </p>

      <p className="mt-2.5 flex-1 text-xs leading-relaxed text-slate-600">{explanation}</p>

      <footer className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reliabilityChip(reliability)}`}
          >
            {reliabilityLabel(reliability)}
          </span>
          <p className="text-[11px] leading-snug text-slate-500">{confidenceNote}</p>
        </div>
      </footer>
    </article>
  );
}
