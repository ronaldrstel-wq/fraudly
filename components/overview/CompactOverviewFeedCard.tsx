import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";
import { getOverviewFeedCardVisual, type OverviewFeedCardVisual } from "@/lib/scoring/trust-bands";

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
  const label = viewLabel.replace(/\s*→\s*$/, "").trim() || viewLabel.trim();
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
  variant = "default"
}: {
  score: number;
  visual: OverviewFeedCardVisual;
  variant?: "default" | "meta";
}) {
  const pillClass = variant === "meta" ? visual.metaScorePill : visual.scorePill;
  const slashClass = variant === "meta" ? visual.metaScoreSlash : visual.scoreSlash;

  if (variant === "meta") {
    return (
      <div className="flex w-[88px] shrink-0 flex-col items-center justify-center">
        <div
          className={pillClass}
          aria-label={`${EN_MESSAGES.latestChecks.trustScorePillLabel}: ${score} out of 100`}
        >
          <span className="font-bold">{score}</span>
          <span className={slashClass}>/100</span>
        </div>
        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide leading-none text-slate-500">
          {EN_MESSAGES.latestChecks.trustScorePillLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
      <div
        className={pillClass}
        aria-label={`${EN_MESSAGES.latestChecks.trustScorePillLabel}: ${score} out of 100`}
      >
        <span>{score}</span>
        <span className={slashClass}>/100</span>
      </div>
      <span className="text-[11px] font-medium leading-none text-slate-500">
        {EN_MESSAGES.latestChecks.trustScorePillLabel}
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
  const cls = ["fraudly-focus", visual.metaViewBtn, decorative ? "" : "hover:border-slate-300"].join(" ");
  const content = (
    <>
      View
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
  viewLabel: string;
  href?: string;
  headlineId: string;
  decorativeCta?: boolean;
  trailingActions?: ReactNode;
}) {
  return (
    <div className="flex w-full shrink-0 flex-col gap-1 md:ml-auto md:w-[288px] md:min-w-[288px] md:max-w-[288px]">
      <div
        className={`grid h-[64px] w-full grid-cols-[4.25rem_minmax(88px,1fr)_auto] items-center gap-x-2 rounded-xl px-3 py-2 ${visual.metaBox}`}
      >
        <time
          className="self-center text-left text-[11px] font-medium leading-tight tabular-nums text-slate-500 whitespace-nowrap"
          dateTime={timeIso}
          title={timeTitle}
        >
          {timeRelative}
        </time>

        <div className="flex items-center justify-center">
          <TrustScoreBlock score={trustScore} visual={visual} variant="meta" />
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
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  entityBadge?: string;
  ariaLabel?: string;
};

function FeedCardBody(props: {
  m: OverviewCardModel;
  visual: OverviewFeedCardVisual;
  headlineId: string;
  domainLine: string;
  domainFullTitle: string;
  entityBadge?: string;
  timeIso: string;
  timeRelative: string;
  timeTitle: string;
  viewLabel: string;
  href?: string;
  decorativeCta?: boolean;
  trailingActions?: ReactNode;
}) {
  const {
    m,
    visual,
    headlineId,
    domainLine,
    domainFullTitle,
    entityBadge,
    timeIso,
    timeRelative,
    timeTitle,
    viewLabel,
    href,
    decorativeCta,
    trailingActions
  } = props;

  const domainLabel =
    entityBadge ?? EN_MESSAGES.latestChecks.entityLabels.domain.toUpperCase();

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
          <p className="sr-only">{domainLabel}</p>
        </div>
      </div>

      <FeedMetaBox
        visual={visual}
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        trustScore={m.trustScore}
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
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        viewLabel={viewLabel}
        decorativeCta
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
    entityBadge
  } = props;

  const visual = getOverviewFeedCardVisual(m.trustScore);

  return (
    <article className={`group w-full ${visual.stripe} ${visual.card} ${visual.cardHover}`}>
      <FeedCardBody
        m={m}
        visual={visual}
        headlineId={headlineId}
        domainLine={domainLine}
        domainFullTitle={domainFullTitle}
        entityBadge={entityBadge}
        timeIso={timeIso}
        timeRelative={timeRelative}
        timeTitle={timeTitle}
        viewLabel={viewLabel}
        href={href}
        trailingActions={trailingActions}
      />
    </article>
  );
}
