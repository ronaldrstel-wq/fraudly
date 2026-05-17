import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";
import { getOverviewCardChrome, type OverviewCardChrome } from "@/lib/scoring/trust-bands";

/** Thick left status rail — primary scanability cue for trust state. */
const ACCENT_BAR_POSITION =
  "before:absolute before:inset-y-2.5 before:left-0 before:z-10 before:w-[7px] before:rounded-r-full";

const FEED_MOTION = "transition-all duration-200 ease-out";
const FEED_CTA_BASE = `inline-flex items-center gap-1.5 text-sm ${FEED_MOTION}`;

function FeedViewResultCta({
  viewLabel,
  chrome,
  href,
  headlineId,
  decorative = false
}: {
  viewLabel: string;
  chrome: OverviewCardChrome;
  href?: string;
  headlineId?: string;
  decorative?: boolean;
}) {
  const label = viewLabel.replace("→", "").trim();
  const cls = `${FEED_CTA_BASE} ${chrome.metaCtaButton} ${chrome.metaCtaButtonHover} ${chrome.metaCta} ${chrome.metaCtaHover}`;
  const content = (
    <>
      {label}
      <span className={`${FEED_MOTION} group-hover:translate-x-1`} aria-hidden>
        →
      </span>
    </>
  );

  if (decorative || !href) {
    return (
      <span className={cls} aria-hidden>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={`fraudly-focus ${cls}`} aria-labelledby={headlineId}>
      {content}
    </Link>
  );
}

function TrustScoreBadge({ score, chrome }: { score: number; chrome: OverviewCardChrome }) {
  return (
    <span
      aria-label={`${EN_MESSAGES.scanResult.trustScoreLabel}: ${score} out of 100`}
      className={`inline-flex h-11 min-w-[7.25rem] shrink-0 items-center justify-center rounded-2xl px-3 py-1 text-[15px] font-bold tabular-nums tracking-tight md:h-10 md:min-w-[6.75rem] md:text-[14px] ${chrome.scorePill}`}
    >
      {score}
      <span className={`ml-0.5 text-[12px] font-semibold md:text-[11px] ${chrome.scorePillDim}`}> / 100</span>
    </span>
  );
}

export type CompactOverviewFeedBaseProps = {
  model: OverviewCardModel;
  headlineId: string;
  domainLine: string;
  domainFullTitle: string;
  href: string;
  prefetch?: boolean;
  viewLabel: string;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  entityBadge?: string;
  ariaLabel?: string;
};

function FeedLeading(props: {
  m: OverviewCardModel;
  chrome: OverviewCardChrome;
  headlineId: string;
  entityBadge?: string;
  domainLine: string;
  domainFullTitle: string;
}) {
  const { m, chrome, headlineId, entityBadge, domainLine, domainFullTitle } = props;

  return (
    <div className="flex min-w-0 flex-1 gap-3.5 md:gap-3">
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[20px] leading-none md:h-10 md:w-10 md:text-[18px] ${chrome.iconWrap} ${chrome.icon}`}
        aria-hidden
      >
        {m.glyph}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        {entityBadge ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{entityBadge}</p>
        ) : null}
        <p
          id={headlineId}
          className={`text-balance text-[19px] font-bold leading-tight tracking-tight md:text-[18px] ${chrome.headlineText}`}
        >
          {m.headline}
        </p>
        <p className="break-all text-[15px] font-semibold leading-snug text-slate-950 md:text-[14.5px]" title={domainFullTitle}>
          {domainLine || "—"}
        </p>
        <p className="text-[13px] leading-snug text-slate-500 md:text-[12.5px]">{m.oneLiner}</p>
      </div>
    </div>
  );
}

function MobileMetaStripe(props: {
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  score: number;
  chrome: OverviewCardChrome;
  children: ReactNode;
}) {
  const { timeIso, timeRelative, timeTitle, score, chrome, children } = props;

  return (
    <div className={`flex min-w-0 flex-col gap-2.5 border-t-2 pt-3.5 md:hidden ${chrome.mobileDivider}`}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <time className="text-[11px] font-medium tabular-nums text-slate-400" dateTime={timeIso} title={timeTitle}>
          {timeRelative}
        </time>
        <TrustScoreBadge score={score} chrome={chrome} />
      </div>
      {children}
    </div>
  );
}

function OverviewCardShell({
  chrome,
  className,
  children
}: {
  chrome: OverviewCardChrome;
  className?: string;
  children: ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden
        className={`pointer-events-none absolute -left-6 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-gradient-to-br blur-3xl md:h-28 md:w-28 ${chrome.surfaceGlow}`}
      />
      <div className={`relative flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between md:gap-5 ${className ?? ""}`}>
        {children}
      </div>
    </>
  );
}

function DesktopMetaStripe(props: {
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  score: number;
  chrome: OverviewCardChrome;
  children: ReactNode;
}) {
  const { timeIso, timeRelative, timeTitle, score, chrome, children } = props;
  return (
    <div className="hidden w-[min(12rem,100%)] min-w-[10rem] shrink-0 flex-col items-stretch gap-2 text-right md:flex">
      <time className="text-[11px] font-medium tabular-nums text-slate-400" dateTime={timeIso} title={timeTitle}>
        {timeRelative}
      </time>
      <div className="flex justify-end">
        <TrustScoreBadge score={score} chrome={chrome} />
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
    bgClassName,
    prefetch = true
  } = props;

  const chrome = getOverviewCardChrome(m.trustScore);
  const shell = `fraudly-focus group relative block ${FEED_MOTION} ${ACCENT_BAR_POSITION} ${chrome.accentBar} ${chrome.cardShell} ${chrome.cardShellHover}`;

  const ctaPresentation = <FeedViewResultCta viewLabel={viewLabel} chrome={chrome} decorative />;

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${shell} ${bgClassName ?? ""}`}
      aria-labelledby={headlineId}
      aria-label={ariaLabel}
    >
      <OverviewCardShell chrome={chrome}>
        <FeedLeading
          m={m}
          chrome={chrome}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />
        <DesktopMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} chrome={chrome}>
          <div className="flex min-h-[2.75rem] items-end justify-end">{ctaPresentation}</div>
        </DesktopMetaStripe>
        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} chrome={chrome}>
          <div className="flex min-h-11 items-center">{ctaPresentation}</div>
        </MobileMetaStripe>
      </OverviewCardShell>
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

  const chrome = getOverviewCardChrome(m.trustScore);
  const viewCta = <FeedViewResultCta viewLabel={viewLabel} chrome={chrome} href={href} headlineId={headlineId} />;

  return (
    <article
      className={`group relative ${FEED_MOTION} ${ACCENT_BAR_POSITION} ${chrome.accentBar} ${chrome.cardShell} ${chrome.cardShellHover}`}
    >
      <OverviewCardShell chrome={chrome}>
        <FeedLeading
          m={m}
          chrome={chrome}
          headlineId={headlineId}
          entityBadge={entityBadge}
          domainLine={domainLine}
          domainFullTitle={domainFullTitle}
        />
        <DesktopMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} chrome={chrome}>
          <div className="flex min-h-[2.75rem] flex-col items-end justify-end gap-2">
            {viewCta}
            {trailingActions ? (
              <div className="flex w-full flex-wrap justify-end gap-2">{trailingActions}</div>
            ) : null}
          </div>
        </DesktopMetaStripe>
        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} chrome={chrome}>
          <div className="flex min-h-11 flex-wrap items-center gap-2">
            {viewCta}
            {trailingActions}
          </div>
        </MobileMetaStripe>
      </OverviewCardShell>
    </article>
  );
}
