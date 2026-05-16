import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";
import { getOverviewCardChrome, type OverviewCardChrome } from "@/lib/scoring/trust-bands";

const ACCENT_BAR_POSITION =
  "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-r md:before:inset-y-2";

const FEED_CTA_BASE = "inline-flex items-center gap-1 text-sm font-semibold transition-colors duration-200";

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
  const cls = `${FEED_CTA_BASE} ${chrome.metaCta} ${chrome.metaCtaHover}`;
  const content = (
    <>
      {label}
      <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden>
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
      className={`inline-flex h-8 w-[108px] shrink-0 items-center justify-center rounded-xl border px-2 py-0.5 text-[12px] font-semibold tabular-nums transition-colors duration-200 md:h-7 md:w-[100px] md:text-[11px] ${chrome.scorePill}`}
    >
      {score}
      <span className={`font-medium ${chrome.scorePillDim}`}> / 100</span>
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
    <div className="flex min-w-0 flex-1 gap-3 md:gap-2.5">
      <span
        className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[18px] leading-none md:mt-0 md:h-9 md:w-9 md:text-[16px] ${chrome.iconWrap} ${chrome.icon}`}
        aria-hidden
      >
        {m.glyph}
      </span>
      <div className="min-w-0 flex-1 space-y-1 md:space-y-0.5">
        {entityBadge ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{entityBadge}</p>
        ) : null}
        <p
          id={headlineId}
          className={`text-balance text-[17px] font-semibold leading-tight tracking-tight md:text-[17px] md:leading-snug ${chrome.headlineText}`}
        >
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
  chrome: OverviewCardChrome;
  children: ReactNode;
}) {
  const { timeIso, timeRelative, timeTitle, score, chrome, children } = props;

  return (
    <div className={`flex min-w-0 flex-col gap-2 border-t pt-3 md:hidden ${chrome.mobileDivider}`}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <time className="text-[12px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
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
        className={`pointer-events-none absolute -left-8 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-gradient-radial blur-2xl md:h-24 md:w-24 ${chrome.surfaceGlow}`}
      />
      <div className={`relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 ${className ?? ""}`}>
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
    <div
      className="hidden w-[min(11rem,100%)] min-w-[9.25rem] shrink-0 flex-col items-stretch gap-1.5 text-right md:flex"
    >
      <time className="text-[11px] font-medium tabular-nums text-slate-500" dateTime={timeIso} title={timeTitle}>
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
  const shell = `fraudly-motion fraudly-focus group relative block ${ACCENT_BAR_POSITION} ${chrome.accentBar} ${chrome.cardShell} ${chrome.cardShellHover} md:px-4 md:py-3`;

  const ctaPresentation = <FeedViewResultCta viewLabel={viewLabel} chrome={chrome} decorative />;

  return (
    <Link href={href} prefetch={prefetch} className={`${shell} ${bgClassName ?? ""}`} aria-labelledby={headlineId} aria-label={ariaLabel}>
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
          <div className="flex min-h-[2.5rem] items-end justify-end">{ctaPresentation}</div>
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
      className={`fraudly-motion group ${ACCENT_BAR_POSITION} ${chrome.accentBar} ${chrome.cardShell} ${chrome.cardShellHover} hover:-translate-y-px md:px-4 md:py-3`}
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
          <div className="flex min-h-[2.5rem] flex-col items-end justify-end gap-1.5">
            {viewCta}
            {trailingActions ? (
              <div className="flex w-full flex-wrap justify-end gap-2 md:pt-0">{trailingActions}</div>
            ) : null}
          </div>
        </DesktopMetaStripe>
        <MobileMetaStripe timeIso={timeIso} timeRelative={timeRelative} timeTitle={timeTitle} score={m.trustScore} chrome={chrome}>
          <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2">
            {viewCta}
            {trailingActions}
          </div>
        </MobileMetaStripe>
      </OverviewCardShell>
    </article>
  );
}
