import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";

type CardTone = "safe" | "caution" | "highRisk";

function toneForKind(kind: OverviewCardModel["humanKind"]): CardTone {
  if (kind === "avoidWebsite" || kind === "dangerousWebsite" || kind === "highRisk") return "highRisk";
  if (kind === "beCareful" || kind === "notEnoughInfo" || kind === "invalidDomain" || kind === "unreachable") return "caution";
  return "safe";
}

function toneClasses(tone: CardTone): {
  accentBar: string;
  icon: string;
  scoreBadge: string;
  scoreDim: string;
  cta: string;
} {
  if (tone === "highRisk") {
    return {
      accentBar: "before:bg-rose-400/90",
      icon: "text-rose-600",
      scoreBadge: "border-rose-200 bg-rose-50 text-rose-900",
      scoreDim: "text-rose-700/80",
      cta: "text-rose-700 decoration-rose-500/35 hover:text-rose-800"
    };
  }
  if (tone === "caution") {
    return {
      accentBar: "before:bg-amber-400/90",
      icon: "text-amber-600",
      scoreBadge: "border-amber-200 bg-amber-50 text-amber-900",
      scoreDim: "text-amber-700/80",
      cta: "text-amber-700 decoration-amber-500/35 hover:text-amber-800"
    };
  }
  return {
    accentBar: "before:bg-emerald-400/90",
    icon: "text-emerald-600",
    scoreBadge: "border-emerald-200 bg-emerald-50 text-emerald-900",
    scoreDim: "text-emerald-700/80",
    cta: "text-emerald-700 decoration-emerald-500/35 hover:text-emerald-800"
  };
}

function TrustScoreBadge({ score, tone }: { score: number; tone: CardTone }) {
  const toneCls = toneClasses(tone);
  return (
    <span
      aria-label={`${EN_MESSAGES.scanResult.trustScoreLabel}: ${score} out of 100`}
      className={`inline-flex h-7 w-[96px] shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${toneCls.scoreBadge}`}
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
    <div className="flex min-w-0 flex-1 gap-3">
      <span className={`mt-0.5 select-none text-xl leading-none ${toneCls.icon}`} aria-hidden>
        {m.glyph}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {entityBadge ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{entityBadge}</p>
        ) : null}
        <p id={headlineId} className="text-balance text-base font-semibold tracking-tight text-slate-900 md:text-lg">
          {m.headline}
        </p>
        <p className="text-sm font-medium leading-snug text-slate-700">{m.technicalLabel}</p>
        <p className="break-all pt-0.5 text-sm font-medium text-slate-900 md:text-[15px]" title={domainFullTitle}>
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
  const shell = `${m.articleClass} ${toneCls.accentBar} fraudly-motion relative block min-h-[188px] rounded-2xl p-4 shadow-subtle before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r md:p-5 hover:border-slate-300/90 hover:shadow-elevated fraudly-focus`;

  const ctaPresentation = <span className={`text-sm font-semibold underline underline-offset-2 ${toneCls.cta}`}>{viewLabel}</span>;

  return (
    <Link href={href} className={`${shell} ${bgClassName ?? ""}`} aria-labelledby={headlineId} aria-label={ariaLabel}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <FeedLeading
          m={m}
          tone={tone}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />

        <div className="hidden min-w-[9.5rem] shrink-0 flex-col items-end gap-2 text-right md:flex">
          <time className="text-xs font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <TrustScoreBadge score={m.trustScore} tone={tone} />
          {ctaPresentation}
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
      className={`${m.articleClass} ${toneCls.accentBar} fraudly-motion relative min-h-[188px] rounded-2xl p-4 shadow-subtle before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r md:p-5 hover:border-slate-300/90 hover:shadow-elevated`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <FeedLeading
          m={m}
          tone={tone}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />

        <div className="hidden min-w-[9.5rem] shrink-0 flex-col items-end gap-2 text-right md:flex">
          <time className="text-xs font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <TrustScoreBadge score={m.trustScore} tone={tone} />
          <Link href={href} className={viewLinkCls} aria-labelledby={headlineId}>
            {viewLabel}
          </Link>
          {trailingActions ? (
            <div className="flex flex-wrap justify-end gap-2 pt-1">{trailingActions}</div>
          ) : null}
        </div>

        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} tone={tone}>
          <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2">
            <Link href={href} className={`inline-flex min-h-11 items-center ${viewLinkCls}`} aria-labelledby={headlineId}>
              {viewLabel}
            </Link>
            {trailingActions}
          </div>
        </MobileMetaStripe>
      </div>
    </article>
  );
}
