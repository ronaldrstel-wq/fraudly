import { useResultFlow } from "@/components/i18n/useResultFlow";
import { fillTemplate } from "@/lib/i18n/fill-template";
import {
  getTrustColorsForDisplay,
  parseConsumerVerdictLabel,
  type ConsumerVerdictLabel
} from "@/lib/scoring/trust-bands";
import { humanRecGlyph, humanRecKindFromTrustVerdict } from "@/lib/scanResultDualLayer";

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

function highlightValueClass(bucket: TrustHighlightRow["bucket"], colors: ReturnType<typeof getTrustColorsForDisplay>): string {
  return bucket === "positive" ? colors.headlineText : colors.toneText;
}

function heroColors(verdict: string, trustScore: number | null) {
  const parsed = parseConsumerVerdictLabel(verdict) as ConsumerVerdictLabel | null;
  return getTrustColorsForDisplay(trustScore, parsed ?? verdict);
}

function heroGlyph(trustScore: number | null): string {
  if (typeof trustScore !== "number" || !Number.isFinite(trustScore)) return "◎";
  return humanRecGlyph(humanRecKindFromTrustVerdict(trustScore, null));
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
  const flow = useResultFlow();
  const previewReasons = topReasons.filter(Boolean).slice(0, 3);
  const colors = heroColors(verdict, trustScore);
  const glyph = heroGlyph(trustScore);

  return (
    <header
      className={`relative overflow-hidden rounded-2xl px-5 py-6 sm:px-7 sm:py-7 ${colors.surfaceGradient}`}
      aria-labelledby="fraudly-verdict-heading"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br blur-3xl ${colors.heroGlow}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl opacity-80 ${colors.heroGlow}`}
      />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <span
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[22px] leading-none sm:h-14 sm:w-14 sm:text-2xl ${colors.heroIconWrap}`}
              aria-hidden
            >
              {glyph}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {flow.scanResult.verdictMicroLabel}
              </p>
              <h2
                id="fraudly-verdict-heading"
                className={`mt-1.5 text-balance text-[2rem] font-bold leading-[1.05] tracking-tight sm:text-[2.75rem] ${colors.headlineText}`}
              >
                {verdict}
              </h2>
            </div>
          </div>

          {domain ? (
            <p className="mt-4 break-all text-[15px] font-semibold text-slate-900 sm:text-base" title={domain}>
              {domain}
            </p>
          ) : null}

          <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-[17px]">{summary}</p>

          {previewReasons.length > 0 ? (
            <ul className="mt-4 max-w-2xl space-y-2 text-sm leading-relaxed text-slate-700">
              {previewReasons.map((line) => (
                <li key={line.slice(0, 48)} className="flex gap-2.5">
                  <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${colors.progressBar}`} aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {typeof trustScore === "number" ? (
          <div className="flex shrink-0 flex-col items-center gap-2 sm:items-end">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {flow.scanResult.trustScoreLabel}
            </p>
            <div
              className={`flex h-[5.5rem] w-[5.5rem] flex-col items-center justify-center rounded-full sm:h-24 sm:w-24 ${colors.heroScoreRing}`}
              aria-label={fillTemplate(flow.scanResult.trustScoreOutOf100Aria, {
                label: flow.scanResult.trustScoreLabel,
                score: trustScore
              })}
            >
              <span className="text-[1.65rem] font-bold tabular-nums leading-none sm:text-3xl">{trustScore}</span>
              <span className={`mt-0.5 text-[11px] font-semibold sm:text-xs ${colors.scorePillDim}`}>/ 100</span>
            </div>
          </div>
        ) : null}
      </div>

      {showMeter && typeof trustScore === "number" && meter ? (
        <div className="relative mt-5 max-w-md" aria-hidden>
          <div className={`h-2 w-full overflow-hidden rounded-full ${meter.track}`}>
            <div
              className={`h-full rounded-full ${meter.fill} transition-[width] duration-500 ease-out`}
              style={{ width: `${Math.max(0, Math.min(100, trustScore))}%` }}
            />
          </div>
        </div>
      ) : null}

      {trustHighlights.length > 0 ? (
        <dl className="relative mt-5 grid max-w-xl gap-2.5 sm:grid-cols-2">
          {trustHighlights.map((row) => (
            <div
              key={row.label}
              className={`rounded-xl border-2 px-3.5 py-2.5 ${colors.softBorder} ${colors.softBg}`}
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{row.label}</dt>
              <dd className={`mt-0.5 text-sm font-semibold leading-snug ${highlightValueClass(row.bucket, colors)}`}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </header>
  );
}
