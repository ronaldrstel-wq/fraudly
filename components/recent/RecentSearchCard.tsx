import Link from "next/link";
import { CompactOverviewFeedArticleCard } from "@/components/overview/CompactOverviewFeedCard";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { buildOverviewFromRecentSearch } from "@/lib/overviewCardPresentation";
import { getTrustPresentation } from "@/lib/scoring/trust-bands";
import type { RecentSearchPublic } from "@/lib/recent-search/service";

type RecentSearchCardProps = {
  row: RecentSearchPublic;
  busy: boolean;
  onDelete: () => void;
};

/**
 * Recent searches row — semantic trust chrome from {@link getTrustPresentation}
 * (via shared overview feed card, identical to latest-checks).
 */
export function RecentSearchCard({ row, busy, onDelete }: RecentSearchCardProps) {
  const { dict } = useLocale();
  const ui = dict.recentSearchesUi;
  const feedUi = dict.latestChecksPage;
  const model = buildOverviewFromRecentSearch({
    trustScoreSnap: row.trustScoreSnap,
    verdictSnap: row.verdictSnap
  });
  const { colors } = getTrustPresentation(model.trustScore);

  const entity =
    ui.entityLabels[row.entityType as keyof typeof ui.entityLabels] ?? row.entityType;
  const primaryLine = overviewFeedPrimaryLine(row.originalQuery.trim());
  const domainFullTitle =
    row.normalizedQuery && row.normalizedQuery.trim() !== row.originalQuery.trim()
      ? `${row.originalQuery.trim()} · ${row.normalizedQuery.trim()}`
      : primaryLine.fullTitle;

  return (
    <CompactOverviewFeedArticleCard
      model={model}
      headlineId={`recent-search-headline-${row.id}`}
      domainLine={primaryLine.primary || row.originalQuery}
      domainFullTitle={domainFullTitle}
      href={row.resultPath}
      viewLabel={ui.reopenResultArrow}
      trustScorePillLabel={feedUi.trustScorePillLabel}
      trustScoreOutOf100Aria={feedUi.trustScoreOutOf100Aria}
      dataConfidenceAria={feedUi.dataConfidenceAria}
      domainEntityFallback={feedUi.entityLabels.domain.toUpperCase()}
      timeIso={row.createdAt}
      timeRelative={formatPublicCheckRelativeTime(row.createdAt)}
      timeTitle={new Date(row.createdAt).toUTCString()}
      entityBadge={entity}
      trailingActions={
        <button
          type="button"
          disabled={busy}
          className={`fraudly-focus min-h-10 rounded-lg border px-3 text-[13px] font-semibold shadow-subtle transition-colors disabled:opacity-50 ${colors.softBorder} ${colors.softBg} ${colors.toneText} hover:brightness-[0.98]`}
          onClick={onDelete}
        >
          {busy ? ui.clearing : ui.deleteOne}
        </button>
      }
    />
  );
}
