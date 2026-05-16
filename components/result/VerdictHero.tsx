import { EN_MESSAGES } from "@/lib/messages.en";

type TrustHighlightRow = {
  label: string;
  value: string;
  bucket: "positive" | "caution";
};

type VerdictHeroProps = {
  verdict: string;
  trustScore: number | null;
  summary: string;
  domain?: string;
  showMeter?: boolean;
  meter?: { track: string; fill: string };
  topReasons?: string[];
  trustHighlights?: TrustHighlightRow[];
};

function highlightValueClass(bucket: TrustHighlightRow["bucket"]): string {
  return bucket === "positive" ? "text-emerald-900" : "text-amber-950";
}

function verdictToneClass(verdict: string): string {
  if (verdict === "Likely Safe") return "text-emerald-900";
  if (verdict === "Use Caution") return "text-amber-950";
  return "text-rose-900";
}

function verdictSurfaceClass(verdict: string): string {
  if (verdict === "Likely Safe") return "border-emerald-200/80 bg-gradient-to-b from-emerald-50/30 to-white";
  if (verdict === "Use Caution") return "border-amber-200/80 bg-gradient-to-b from-amber-50/35 to-white";
  return "border-rose-200/80 bg-gradient-to-b from-rose-50/35 to-white";
}

export function VerdictHero({
  verdict,
  trustScore,
  summary,
  domain,
  showMeter = false,
  meter,
  topReasons = [],
  trustHighlights = []
}: VerdictHeroProps) {
  const previewReasons = topReasons.filter(Boolean).slice(0, 3);

  return (
    <header
      className={`rounded-2xl border px-5 py-5 shadow-sm sm:px-6 sm:py-6 ${verdictSurfaceClass(verdict)}`}
      aria-labelledby="fraudly-verdict-heading"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {EN_MESSAGES.scanResult.verdictMicroLabel}
      </p>
      <h2
        id="fraudly-verdict-heading"
        className={`mt-2 text-balance text-4xl font-bold tracking-tight sm:text-[2.65rem] sm:leading-[1.05] ${verdictToneClass(verdict)}`}
      >
        {verdict}
      </h2>

      {typeof trustScore === "number" ? (
        <p className="mt-3 text-base text-slate-600">
          Trust score:{" "}
          <span className="text-lg font-semibold tabular-nums text-slate-800">{trustScore}</span>
          <span className="text-slate-400"> / 100</span>
        </p>
      ) : null}

      {showMeter && typeof trustScore === "number" && meter ? (
        <div className="mt-3 max-w-md" aria-hidden>
          <div className={`h-1.5 w-full overflow-hidden rounded-full ${meter.track}`}>
            <div
              className={`h-full rounded-full ${meter.fill} transition-[width] duration-500 ease-out`}
              style={{ width: `${Math.max(0, Math.min(100, trustScore))}%` }}
            />
          </div>
        </div>
      ) : null}

      {trustHighlights.length > 0 ? (
        <dl className="mt-3 grid max-w-xl gap-2.5 sm:grid-cols-2">
          {trustHighlights.map((row) => (
            <div key={row.label} className="rounded-lg border border-slate-200/80 bg-white/60 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
              <dd className={`mt-0.5 text-sm font-medium leading-snug ${highlightValueClass(row.bucket)}`}>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-700 sm:text-[17px]">{summary}</p>

      {previewReasons.length > 0 ? (
        <ul className="mt-4 max-w-2xl space-y-1.5 text-sm leading-relaxed text-slate-700">
          {previewReasons.map((line) => (
            <li key={line.slice(0, 48)} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {domain ? (
        <p className="mt-4 break-all text-sm font-medium text-slate-800" title={domain}>
          {domain}
        </p>
      ) : null}
    </header>
  );
}
