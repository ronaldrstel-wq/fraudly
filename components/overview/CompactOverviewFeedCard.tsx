import Link from "next/link";
import type { ReactNode } from "react";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { OverviewCardModel } from "@/lib/overviewCardPresentation";
import { getOverviewFeedCardVisual, type OverviewFeedCardVisual } from "@/lib/scoring/trust-bands";

const CARD_PAD = "px-4 py-4 sm:px-5 sm:py-5 md:min-h-[148px]";

function FeedVerdictIcon({ visual }: { visual: OverviewFeedCardVisual }) {
  const ink = visual.iconInk;
  const svgProps = { className: `h-9 w-9 sm:h-10 sm:w-10 ${ink}`, fill: "none", viewBox: "0 0 24 24", "aria-hidden": true as const };

  if (visual.iconKind === "trusted") {
    return (
      <svg {...svgProps}>
        <path
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3 4 7v5c0 4.42 3.28 8.56 8 9 4.72-.44 8-4.58 8-9V7l-8-4Z"
        />
        <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (visual.iconKind === "caution") {
    return (
      <svg {...svgProps}>
        <path
          stroke="currentColor"
          strokeWidth="1.75"
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
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86 2.82 17a1 1 0 0 0 .86 1.5h16.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z"
        />
        <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M4 4 20 20" />
      </svg>
    );
  }

  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="m20 20-3.5-3.5" />
      <path stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M11 8v6M8 11h6" />
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
  const label = viewLabel.replace("→", "").trim();
  const cls = `fraudly-focus ${visual.cta} ${visual.ctaHover} whitespace-nowrap`;
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
    <Link href={href} className={cls} aria-labelledby={headlineId}>
      {content}
    </Link>
  );
}

function TrustScoreBlock({ score, visual }: { score: number; visual: OverviewFeedCardVisual }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={visual.scorePill}
        aria-label={`${EN_MESSAGES.latestChecks.trustScorePillLabel}: ${score} out of 100`}
      >
        <span>{score}</span>
        <span className={visual.scoreSlash}>/100</span>
      </div>
      <span className="text-[11px] font-medium text-slate-500">{EN_MESSAGES.latestChecks.trustScorePillLabel}</span>
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
    <div className={`relative ${CARD_PAD}`}>
      <time
        className="absolute right-4 top-4 z-10 text-xs font-medium tabular-nums text-slate-500 sm:right-5 sm:top-5"
        dateTime={timeIso}
        title={timeTitle}
      >
        {timeRelative}
      </time>

      <div className="grid grid-cols-1 items-center gap-4 pt-5 sm:gap-5 md:grid-cols-[minmax(0,1fr)_180px_160px] md:gap-6 md:pt-0">
        <div className="flex min-w-0 items-start gap-4 sm:gap-5 md:pr-2">
          <div className={visual.iconCircle}>
            <FeedVerdictIcon visual={visual} />
          </div>

          <div className="min-w-0 flex-1 space-y-1 overflow-hidden sm:space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{domainLabel}</p>
            <h2 id={headlineId} className={`text-balance ${visual.headline}`}>
              {m.headline}
            </h2>
            <p className="line-clamp-2 text-sm leading-snug text-slate-600">{m.oneLiner}</p>
            <p className="truncate text-base font-bold leading-snug text-slate-900" title={domainFullTitle}>
              {domainLine || "—"}
            </p>
          </div>
        </div>

        <div className="flex w-full justify-center justify-self-center md:w-[180px]">
          <TrustScoreBlock score={m.trustScore} visual={visual} />
        </div>

        <div className="flex w-full flex-wrap items-center justify-end justify-self-end gap-2 md:w-[160px]">
          <FeedViewResultCta
            viewLabel={viewLabel}
            visual={visual}
            href={href}
            headlineId={headlineId}
            decorative={decorativeCta}
          />
          {trailingActions}
        </div>
      </div>
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
  const shell = `fraudly-focus group block ${visual.stripe} ${visual.card} ${visual.cardHover} ${bgClassName ?? ""}`;

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
    <article className={`group ${visual.stripe} ${visual.card} ${visual.cardHover}`}>
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
