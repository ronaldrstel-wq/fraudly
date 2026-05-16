import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";

type CardTone = "safe" | "caution" | "highRisk";

function toneForKind(kind: OverviewCardModel["humanKind"]): CardTone {
  if (kind === "avoidWebsite" || kind === "dangerousWebsite" || kind === "highRisk") return "highRisk";
  if (kind === "beCareful" || kind === "notEnoughInfo" || kind === "invalidDomain" || kind === "unreachable" || kind === "risky")
    return "caution";
  return "safe";
}

function toneClasses(tone: CardTone): {
  surfaceGlow: string;
  accentBar: string;
  iconWrap: string;
  icon: string;
  scoreBadge: string;
  scoreDim: string;
  cta: string;
  ctaArrow: string;
} {
  if (tone === "highRisk") {
    return {
      surfaceGlow: "from-rose-500/10 via-rose-400/0 to-transparent",
      accentBar: "before:bg-rose-400/80",
      iconWrap: "border-rose-200/70 bg-rose-50/90 shadow-[0_6px_18px_rgba(244,63,94,0.18)]",
      icon: "text-rose-600",
      scoreBadge:
        "border-rose-200/80 bg-gradient-to-b from-rose-50 to-white text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(244,63,94,0.14)]",
      scoreDim: "text-rose-700/80",
      cta: "text-rose-700 decoration-rose-500/35 hover:text-rose-800",
      ctaArrow: "group-hover:translate-x-0.5"
    };
  }
  if (tone === "caution") {
    return {
      surfaceGlow: "from-amber-500/10 via-amber-400/0 to-transparent",
      accentBar: "before:bg-amber-400/80",
      iconWrap: "border-amber-200/70 bg-amber-50/90 shadow-[0_6px_18px_rgba(245,158,11,0.16)]",
      icon: "text-amber-600",
      scoreBadge:
        "border-amber-200/80 bg-gradient-to-b from-amber-50 to-white text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(245,158,11,0.12)]",
      scoreDim: "text-amber-700/80",
      cta: "text-amber-700 decoration-amber-500/35 hover:text-amber-800",
      ctaArrow: "group-hover:translate-x-0.5"
    };
  }
  return {
    surfaceGlow: "from-emerald-500/10 via-emerald-400/0 to-transparent",
    accentBar: "before:bg-emerald-400/80",
    iconWrap: "border-emerald-200/70 bg-emerald-50/90 shadow-[0_6px_18px_rgba(16,185,129,0.15)]",
    icon: "text-emerald-600",
    scoreBadge:
      "border-emerald-200/80 bg-gradient-to-b from-emerald-50 to-white text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_14px_rgba(16,185,129,0.12)]",
    scoreDim: "text-emerald-700/80",
    cta: "text-emerald-700 decoration-emerald-500/35 hover:text-emerald-800",
    ctaArrow: "group-hover:translate-x-0.5"
  };
}

function TrustScoreBadge({ score, tone }: { score: number; tone: CardTone }) {
  const toneCls = toneClasses(tone);
  return (
    <span
      aria-label={`${EN_MESSAGES.scanResult.trustScoreLabel}: ${score} out of 100`}
      className={`inline-flex h-8 w-[108px] shrink-0 items-center justify-center rounded-xl border px-2 py-0.5 text-[12px] font-semibold tabular-nums transition-transform duration-200 md:h-7 md:w-[100px] md:text-[11px] ${toneCls.scoreBadge}`}
    >
      {score}
      <span className={`font-medium ${toneCls.scoreDim}`}> / 100</span>
    </span>
  );
}

export type CompactOverviewFeedBaseProps = {
  model: OverviewCardModel;
  headlineId: string;
  domainLine: string;
  domainFullTitle: string;
  href: string;
  viewLabel: string;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  entityBadge?: string;
  ariaLabel?: string;
};

function FeedLeading(props: {
  m: OverviewCardModel;
  tone: CardTone;
  headlineId: string;
  entityBadge?: string;
  domainLine: string;
  domainFullTitle: string;
}) {
  const { m, tone, headlineId, entityBadge, domainLine, domainFullTitle } = props;
  const toneCls = toneClasses(tone);

  return (
    <div className="flex min-w-0 flex-1 gap-3 md:gap-2.5">
      <span
        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[18px] leading-none md:mt-0 md:h-9 md:w-9 md:text-[16px] ${toneCls.iconWrap} ${toneCls.icon}`}
        aria-hidden
      >
        {m.glyph}
      </span>
      <div className="min-w-0 flex-1 space-y-1 md:space-y-0.5">
        {entityBadge ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{entityBadge}</p>
        ) : null}
        <p id={headlineId} className="text-balance text-[17px] font-semibold leading-tight tracking-tight text-slate-900 md:text-[17px] md:leading-snug">
          {m.headline}
        </p>
        <p className="text-[13px] font-medium leading-snug text-slate-600 md:text-[12.5px] md:leading-snug">{m.oneLiner}</p>
        <p className="break-all pt-0.5 text-[14px] font-medium text-slate-900 md:pt-0 md:text-[14px]" title={domainFullTitle}>
          {domainLine || "—"}
        </p>
      </div>
    </div>
  );
}

function MobileMetaStripe(props: {
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  score: number;
  tone: CardTone;
  children: ReactNode;
}) {
  const { timeIso, timeRelative, timeTitle, score, tone, children } = props;

  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-slate-200/70 pt-3 md:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <time className="text-[12px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
          {timeRelative}
        </time>
        <TrustScoreBadge score={score} tone={tone} />
      </div>
      {children}
    </div>
  );
}

/** Whole row is one link — use only when nothing else inside is interactive. */
export function CompactOverviewFeedLinkCard(props: CompactOverviewFeedBaseProps & { bgClassName?: string }) {
  const {
    model: m,
    headlineId,
    domainLine,
    domainFullTitle,
    href,
    viewLabel,
    timeIso,
    timeRelative,
    timeTitle,
    entityBadge,
    ariaLabel,
    bgClassName
  } = props;

  const tone = toneForKind(m.humanKind);
  const toneCls = toneClasses(tone);
  const shell = `${m.articleClass} ${toneCls.accentBar} fraudly-motion relative block min-h-0 rounded-2xl p-4 shadow-subtle before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r md:px-4 md:py-3 md:before:inset-y-2 hover:border-slate-300/90 hover:shadow-elevated fraudly-focus`;

  const ctaPresentation = (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2 ${toneCls.cta}`}>
      {viewLabel.replace("→", "").trim()}
      <span className={`transition-transform duration-200 ${toneCls.ctaArrow}`}>→</span>
    </span>
  );

  return (
    <Link href={href} className={`${shell} group ${bgClassName ?? ""}`} aria-labelledby={headlineId} aria-label={ariaLabel}>
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-radial blur-2xl md:h-24 md:w-24 ${toneCls.surfaceGlow}`}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <FeedLeading
          m={m}
          tone={tone}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />

        <div className="hidden w-[min(11rem,100%)] min-w-[9.25rem] shrink-0 flex-col items-stretch gap-1.5 rounded-xl border border-slate-200/50 bg-gradient-to-b from-slate-50/70 to-white/30 px-2.5 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] md:flex">
          <time className="text-[11px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <div className="flex justify-end">
            <TrustScoreBadge score={m.trustScore} tone={tone} />
          </div>
          <div className="flex min-h-[2.5rem] items-end justify-end">{ctaPresentation}</div>
        </div>

        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} tone={tone}>
          <div className="flex min-h-11 items-center">{ctaPresentation}</div>
        </MobileMetaStripe>
      </div>
    </Link>
  );
}

/** Article with explicit View link and optional trailing actions (never nested inside the link). */
export function CompactOverviewFeedArticleCard(props: CompactOverviewFeedBaseProps & { trailingActions?: ReactNode }) {
  const {
    model: m,
    trailingActions,
    headlineId,
    domainLine,
    domainFullTitle,
    href,
    viewLabel,
    timeIso,
    timeRelative,
    timeTitle,
    entityBadge
  } = props;
  const tone = toneForKind(m.humanKind);
  const toneCls = toneClasses(tone);

  const viewLinkCls = `fraudly-focus rounded-lg text-sm font-semibold underline underline-offset-2 ${toneCls.cta}`;

  return (
    <article
      className={`${m.articleClass} ${toneCls.accentBar} fraudly-motion group relative min-h-0 rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-[1px] before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r md:px-4 md:py-3 md:before:inset-y-2 hover:-translate-y-[1px] hover:border-slate-300/80 hover:shadow-[0_12px_34px_rgba(15,23,42,0.10)]`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-radial blur-2xl md:h-24 md:w-24 ${toneCls.surfaceGlow}`}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <FeedLeading
          m={m}
          tone={tone}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />

        <div className="hidden w-[min(11rem,100%)] min-w-[9.25rem] shrink-0 flex-col items-stretch gap-1.5 rounded-xl border border-slate-200/50 bg-gradient-to-b from-slate-50/70 to-white/30 px-2.5 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] md:flex">
          <time className="text-[11px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <div className="flex justify-end">
            <TrustScoreBadge score={m.trustScore} tone={tone} />
          </div>
          <div className="flex min-h-[2.5rem] flex-col items-end justify-end gap-1.5">
            <Link href={href} className={`inline-flex items-end ${viewLinkCls}`} aria-labelledby={headlineId}>
              <span className="inline-flex items-center gap-1">
                {viewLabel.replace("→", "").trim()}
                <span className={`transition-transform duration-200 ${toneCls.ctaArrow}`}>→</span>
              </span>
            </Link>
            {trailingActions ? (
              <div className="flex w-full flex-wrap justify-end gap-2 md:pt-0">{trailingActions}</div>
            ) : null}
          </div>
        </div>

        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} tone={tone}>
          <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2">
            <Link href={href} className={`inline-flex min-h-11 items-center ${viewLinkCls}`} aria-labelledby={headlineId}>
              <span className="inline-flex items-center gap-1">
                {viewLabel.replace("→", "").trim()}
                <span className={`transition-transform duration-200 ${toneCls.ctaArrow}`}>→</span>
              </span>
            </Link>
            {trailingActions}
          </div>
        </MobileMetaStripe>
      </div>
    </article>
  );
}
