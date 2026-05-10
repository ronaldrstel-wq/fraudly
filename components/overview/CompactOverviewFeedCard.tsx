import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";

function TrustScoreBadge({ score, isCritical }: { score: number; isCritical: boolean }) {
  return (
    <span
      aria-label={`${EN_MESSAGES.scanResult.trustScoreLabel}: ${score} out of 100`}
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ${
        isCritical
          ? "border-red-300/90 bg-white/90 text-red-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {score}
      <span className={isCritical ? "font-semibold text-red-700/80" : "font-normal text-slate-400"}> / 100</span>
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
  headlineId: string;
  entityBadge?: string;
  domainLine: string;
  domainFullTitle: string;
}) {
  const { m, headlineId, entityBadge, domainLine, domainFullTitle } = props;

  return (
    <div className="flex min-w-0 flex-1 gap-3">
      <span className={`select-none text-xl leading-none md:mt-0.5 ${m.tone.icon}`} aria-hidden>
        {m.glyph}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5 md:space-y-1">
        {entityBadge ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{entityBadge}</p>
        ) : null}
        <p id={headlineId} className={`text-balance text-base font-bold tracking-tight md:text-lg ${m.tone.text}`}>
          {m.headline}
        </p>
        <p className="text-sm font-semibold leading-snug text-slate-800">{m.technicalLabel}</p>
        <p className="truncate pt-0.5 text-sm font-medium text-slate-900 md:text-[15px]" title={domainFullTitle}>
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
  isCritical: boolean;
  children: ReactNode;
}) {
  const { timeIso, timeRelative, timeTitle, score, isCritical, children } = props;

  return (
    <div className="flex min-w-0 flex-col gap-2 border-t border-slate-200/70 pt-3 md:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <time className="text-[12px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
          {timeRelative}
        </time>
        <TrustScoreBadge score={score} isCritical={isCritical} />
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

  const shell = `${m.articleClass} fraudly-motion block rounded-2xl p-4 shadow-subtle md:p-5 ${m.isCritical ? "" : "hover:border-slate-300/90 hover:shadow-elevated"} fraudly-focus`;

  const ctaPresentation = (
    <span className="text-sm font-semibold text-blue-700 underline decoration-blue-600/35 underline-offset-2">{viewLabel}</span>
  );

  return (
    <Link href={href} className={`${shell} ${bgClassName ?? ""}`} aria-labelledby={headlineId} aria-label={ariaLabel}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <FeedLeading m={m} headlineId={headlineId} entityBadge={entityBadge} domainLine={domainLine} domainFullTitle={domainFullTitle} />

        <div className="hidden min-w-[9.5rem] shrink-0 flex-col items-end gap-1.5 text-right md:flex">
          <time className="text-xs font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <TrustScoreBadge score={m.trustScore} isCritical={m.isCritical} />
          {ctaPresentation}
        </div>

        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} isCritical={m.isCritical}>
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

  const viewLinkCls =
    "fraudly-focus rounded-lg text-sm font-semibold text-blue-700 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800";

  return (
    <article
      className={`${m.articleClass} fraudly-motion rounded-2xl p-4 shadow-subtle md:p-5 ${m.isCritical ? "" : "hover:border-slate-300/90 hover:shadow-elevated"}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <FeedLeading m={m} headlineId={headlineId} entityBadge={entityBadge} domainLine={domainLine} domainFullTitle={domainFullTitle} />

        <div className="hidden min-w-[9.5rem] shrink-0 flex-col items-end gap-2 text-right md:flex">
          <time className="text-xs font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
            {timeRelative}
          </time>
          <TrustScoreBadge score={m.trustScore} isCritical={m.isCritical} />
          <Link href={href} className={viewLinkCls} aria-labelledby={headlineId}>
            {viewLabel}
          </Link>
          {trailingActions ? (
            <div className="flex flex-wrap justify-end gap-2 pt-1">{trailingActions}</div>
          ) : null}
        </div>

        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} isCritical={m.isCritical}>
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
