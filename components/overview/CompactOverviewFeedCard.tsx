import Link from "next/link";
import type { ReactNode } from "react";
import { FeedCardDevLogger } from "@/components/overview/FeedCardDevLogger";
import { fillTemplate } from "@/lib/i18n/fill-template";
import { TrustDataConfidenceBadge } from "@/components/trust/TrustDataConfidenceBadge";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";
import { getOverviewFeedCardVisual, type OverviewFeedCardVisual } from "@/lib/scoring/trust-bands";
import type { DataConfidenceBadgeModel } from "@/lib/trust/dataConfidence";

const CARD_PAD = "px-4 py-3.5 sm:px-5 sm:py-3.5 md:min-h-[116px]";

function FeedVerdictIcon({ visual }: { visual: OverviewFeedCardVisual }) {
  const ink = visual.iconInk;
  const svgProps = {
    className: `h-6 w-6 shrink-0 ${ink}`,
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
    "aria-hidden": true as const
  };

  if (visual.iconKind === "trusted") {
    return (
      <svg {...svgProps}>
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3 4 7v5c0 4.42 3.28 8.56 8 9 4.72-.44 8-4.58 8-9V7l-8-4Z"
        />
        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (visual.iconKind === "caution") {
    return (
      <svg {...svgProps}>
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a1 1 0 0 0 .86 1.5h16.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
        />
      </svg>
    );
  }

  if (visual.iconKind === "danger") {
    return (
      <svg {...svgProps}>
        <path
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a1 1 0 0 0 .86 1.5h16.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
        />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m20 20-3.5-3.5" />
      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M11 8v6M8 11h6" />
    </svg>
  );
}

function FeedViewResultCta({
  viewLabel,
  visual,
  href,
  headlineId,
  decorative = false
}: {
  viewLabel: string;
  visual: OverviewFeedCardVisual;
  href?: string;
  headlineId?: string;
  decorative?: boolean;
}) {
  const safeLabel = viewLabel ?? "";
  const label = safeLabel.replace(/\s*→\s*$/, "").trim() || safeLabel.trim();
  const cls = [
    "fraudly-focus inline-flex shrink-0 items-center gap-1 text-sm font-bold opacity-100",
    visual.ctaText,
    decorative ? visual.ctaTextHover : `${visual.ctaTextHover} underline-offset-2 hover:underline`
  ].join(" ");
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
    <Link href={href} className={cls} aria-labelledby={headlineId} prefetch>
      {content}
    </Link>
  );
}

function TrustScoreBlock({
  score,
  visual,
  trustScorePillLabel,
  trustScoreOutOf100Aria,
  variant = "default"
}: {
  score: number;
  visual: OverviewFeedCardVisual;
  trustScorePillLabel: string;
  trustScoreOutOf100Aria: string;
  variant?: "default" | "meta";
}) {
  const scoreAria = fillTemplate(trustScoreOutOf100Aria, { label: trustScorePillLabel, score });
  const pillClass = variant === "meta" ? visual.metaScorePill : visual.scorePill;
  const slashClass = variant === "meta" ? visual.metaScoreSlash : visual.scoreSlash;

  if (variant === "meta") {
    return (
      <div className="flex w-[88px] shrink-0 flex-col items-center justify-center">
        <div
          className={pillClass}
          aria-label={scoreAria}
        >
          <span className="inline-flex items-baseline justify-center gap-0.5 leading-none">
            <span className="font-bold tabular-nums">{score}</span>
            <span className={slashClass}>/100</span>
          </span>
        </div>
        <span className="mt-0.5 w-full text-center text-[9px] font-medium uppercase tracking-wide leading-none text-slate-500">
          {trustScorePillLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
      <div
        className={pillClass}
        aria-label={scoreAria}
      >
        <span>{score}</span>
        <span className={slashClass}>/100</span>
      </div>
      <span className="text-[11px] font-medium leading-none text-slate-500">
        {trustScorePillLabel}
      </span>
    </div>
  );
}

function FeedMetaViewCta({
  viewLabel,
  visual,
  href,
  headlineId,
  decorative = false
}: {
  viewLabel: string;
  visual: OverviewFeedCardVisual;
  href?: string;
  headlineId?: string;
  decorative?: boolean;
}) {
  const safeLabel = viewLabel ?? "";
  const label = safeLabel.replace(/\s*→\s*$/, "").trim() || safeLabel.trim();
  const cls = ["fraudly-focus", visual.metaViewBtn, decorative ? "" : "hover:border-slate-300"].join(" ");
  const content = (
    <>
      {label}
      <span aria-hidden>→</span>
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
    <Link
      href={href}
      className={cls}
      aria-labelledby={headlineId}
      aria-label={viewLabel}
      prefetch
    >
      {content}
    </Link>
  );
}

function FeedMetaBox({
  visual,
  timeIso,
  timeRelative,
  timeTitle,
  trustScore,
  trustScorePillLabel,
  trustScoreOutOf100Aria,
  viewLabel,
  href,
  headlineId,
  decorativeCta,
  trailingActions
}: {
  visual: OverviewFeedCardVisual;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  trustScore: number;
  trustScorePillLabel: string;
  trustScoreOutOf100Aria: string;
  viewLabel: string;
  href?: string;
  headlineId: string;
  decorativeCta?: boolean;
  trailingActions?: ReactNode;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-1 md:ml-auto md:min-w-[17rem] md:max-w-[20rem] md:flex-[0_1_20rem]">
      <div
        className={`flex min-h-[4rem] w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 sm:gap-3 sm:px-3.5 ${visual.metaBox}`}
      >
        <time
          className="min-w-0 shrink-0 text-left text-[11px] font-medium leading-snug tabular-nums text-slate-500"
          dateTime={timeIso}
          title={timeTitle}
        >
          {timeRelative}
        </time>

        <div className="flex flex-1 items-center justify-center">
          <TrustScoreBlock
            score={trustScore}
            visual={visual}
            trustScorePillLabel={trustScorePillLabel}
            trustScoreOutOf100Aria={trustScoreOutOf100Aria}
            variant="meta"
          />
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <FeedMetaViewCta
            viewLabel={viewLabel}
            visual={visual}
            href={href}
            headlineId={headlineId}
            decorative={decorativeCta}
          />
        </div>
      </div>
      {trailingActions ? <div className="flex flex-wrap justify-end gap-2">{trailingActions}</div> : null}
    </div>
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
  trustScorePillLabel: string;
  trustScoreOutOf100Aria: string;
  dataConfidenceAria: string;
  domainEntityFallback?: string;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  entityBadge?: string;
  ariaLabel?: string;
  confidenceBadges?: DataConfidenceBadgeModel[];
};

function FeedCardBody(props: {
  m: OverviewCardModel;
  visual: OverviewFeedCardVisual;
  headlineId: string;
  domainLine: string;
  domainFullTitle: string;
  entityBadge?: string;
  domainEntityFallback: string;
  trustScorePillLabel: string;
  trustScoreOutOf100Aria: string;
  dataConfidenceAria: string;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  viewLabel: string;
  href?: string;
  decorativeCta?: boolean;
  trailingActions?: ReactNode;
  confidenceBadges?: DataConfidenceBadgeModel[];
}) {
  const {
    m,
    visual,
    headlineId,
    domainLine,
    domainFullTitle,
    entityBadge,
    domainEntityFallback,
    trustScorePillLabel,
    trustScoreOutOf100Aria,
    dataConfidenceAria,
    timeIso,
    timeRelative,
    timeTitle,
    viewLabel,
    href,
    decorativeCta,
    trailingActions,
    confidenceBadges
  } = props;

  const domainLabel = entityBadge ?? domainEntityFallback;

  return (
    <div className={`flex w-full min-w-0 flex-col gap-2.5 ${CARD_PAD} md:flex-row md:items-center md:gap-3.5`}>
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-3 sm:gap-3.5">
        <div className={`${visual.iconCircle} leading-none [&_svg]:block`} aria-hidden>
          <FeedVerdictIcon visual={visual} />
        </div>

        <div className="min-w-0 flex-1 space-y-0 overflow-hidden sm:space-y-0.5">
          <h2 id={headlineId} className={`text-balance ${visual.headline}`}>
            {m.headline}
          </h2>
          <p className="truncate text-base font-[600] leading-snug text-slate-900" title={domainFullTitle}>
            {domainLine || "—"}
          </p>
          <p className="line-clamp-2 text-sm font-normal leading-snug text-slate-600">{m.oneLiner}</p>
          {confidenceBadges && confidenceBadges.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5" aria-label={dataConfidenceAria}>
              {confidenceBadges.map((badge) => (
                <TrustDataConfidenceBadge key={`${badge.indicator}-${badge.label}`} badge={badge} />
              ))}
            </div>
          ) : null}
          <p className="sr-only">{domainLabel}</p>
        </div>
      </div>

      <FeedMetaBox
        visual={visual}
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        trustScore={m.trustScore}
        trustScorePillLabel={trustScorePillLabel}
        trustScoreOutOf100Aria={trustScoreOutOf100Aria}
        viewLabel={viewLabel}
        href={href}
        headlineId={headlineId}
        decorativeCta={decorativeCta}
        trailingActions={trailingActions}
      />
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
    trustScorePillLabel,
    trustScoreOutOf100Aria,
    dataConfidenceAria,
    domainEntityFallback = "DOMAIN",
    ariaLabel,
    bgClassName,
    prefetch = true
  } = props;

  const visual = getOverviewFeedCardVisual(m.trustScore);
  const shell = `fraudly-focus group block w-full ${visual.stripe} ${visual.card} ${visual.cardHover} ${bgClassName ?? ""}`;

  return (
    <Link href={href} prefetch={prefetch} className={shell} aria-labelledby={headlineId} aria-label={ariaLabel}>
      <FeedCardBody
        m={m}
        visual={visual}
        headlineId={headlineId}
        domainLine={domainLine}
        domainFullTitle={domainFullTitle}
        entityBadge={entityBadge}
        domainEntityFallback={domainEntityFallback}
        trustScorePillLabel={trustScorePillLabel}
        trustScoreOutOf100Aria={trustScoreOutOf100Aria}
        dataConfidenceAria={dataConfidenceAria}
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        viewLabel={viewLabel}
        decorativeCta
        confidenceBadges={props.confidenceBadges}
      />
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
    entityBadge,
    trustScorePillLabel,
    trustScoreOutOf100Aria,
    dataConfidenceAria,
    domainEntityFallback = "DOMAIN"
  } = props;

  const visual = getOverviewFeedCardVisual(m.trustScore);
  const shellClassName = `group w-full ${visual.stripe} ${visual.card} ${visual.cardHover}`;

  return (
    <article className={shellClassName}>
      {process.env.NODE_ENV !== "production" ? (
        <FeedCardDevLogger
          headlineId={headlineId}
          componentName="CompactOverviewFeedArticleCard"
          domain={domainLine}
          verdict={m.headline}
          shellClassName={shellClassName}
        />
      ) : null}
      <FeedCardBody
        m={m}
        visual={visual}
        headlineId={headlineId}
        domainLine={domainLine}
        domainFullTitle={domainFullTitle}
        entityBadge={entityBadge}
        domainEntityFallback={domainEntityFallback}
        trustScorePillLabel={trustScorePillLabel}
        trustScoreOutOf100Aria={trustScoreOutOf100Aria}
        dataConfidenceAria={dataConfidenceAria}
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        viewLabel={viewLabel}
        href={href}
        trailingActions={trailingActions}
        confidenceBadges={props.confidenceBadges}
      />
    </article>
  );
}
