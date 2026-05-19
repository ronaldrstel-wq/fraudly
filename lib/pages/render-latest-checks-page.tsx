import Link from "next/link";
import { LatestChecksJsonLd } from "@/components/seo/LatestChecksJsonLd";
import { LatestChecksHero } from "@/components/latest-checks/LatestChecksHero";
import { CompactOverviewFeedArticleCard } from "@/components/overview/CompactOverviewFeedCard";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { homeHref, localizedPath } from "@/lib/i18n/paths";
import { publicCheckPath } from "@/lib/seo/public-check-links";
import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import { logDisplayScoreDebug } from "@/lib/scoring/displayScore";
import { feedListRowConfidenceBadges } from "@/lib/trust/feedConfidenceStrip";
import {
  detectRiskTrustMismatch,
  logTrustDisplayAlignment
} from "@/lib/trust/trustDisplayLog";
import { fetchLatestPublicChecksFeedPage } from "@/lib/latest-public-checks/fetchFeedPage";
import { normalizeLastSeenAt } from "@/lib/latest-public-checks/normalizeLastSeenAt";
import type { LatestPublicCheckListRow } from "@/lib/latest-public-checks/listPublicChecks";

const PAGE_SIZE = 10;

type PageProps = { searchParams: Promise<{ page?: string }> };

function clampPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

function entityBadge(type: string | null | undefined, locale: import("@/lib/i18n/locales").Locale): string {
  const labels = getDictionary(locale).latestChecksPage.entityLabels;
  const fallback = getDictionary(locale).latestChecksPage.entityFallback;
  if (!type) return fallback;
  const k = type as keyof typeof labels;
  return k in labels ? labels[k] : fallback;
}

function safeLastSeenIso(lastSeenAt: Date | string): string {
  return normalizeLastSeenAt(lastSeenAt).toISOString();
}

function safeCardHref(row: LatestPublicCheckListRow): string {
  const primary = overviewFeedPrimaryLine(row.checkedValue ?? row.normalizedValue).primary;
  const domain = primary || row.normalizedValue || "unknown";
  return publicCheckPath(domain);
}

function LatestCheckListItem({ row, locale }: { row: LatestPublicCheckListRow; locale: import("@/lib/i18n/locales").Locale }) {
  const ui = getDictionary(locale).latestChecksPage;
  try {
    const m = buildOverviewFromPublicCheck(row);
    logDisplayScoreDebug({
      domain: row.checkedValue,
      scanId: row.id,
      storedRiskScore: Number.isFinite(row.riskScoreSnapshot) ? row.riskScoreSnapshot : 0,
      storedTrustScore: m.trustScore,
      displayedTrustScore: m.trustScore,
      displayedLabel: m.verdictLabel,
      source: "latest-checks/page"
    });
    const iso = safeLastSeenIso(row.lastSeenAt);
    const primaryLine = overviewFeedPrimaryLine(row.checkedValue ?? row.normalizedValue);
    const domainLine = primaryLine.primary || row.normalizedValue || ui.entityFallback;
    const confidenceBadges = feedListRowConfidenceBadges({
      normalizedTrustScore: row.normalizedTrustScore,
      consumerVerdictLabel: row.consumerVerdictLabel,
      lastSeenAt: row.lastSeenAt
    });

    logTrustDisplayAlignment({
      domain: row.normalizedValue,
      scanId: row.id,
      riskScore: row.riskScoreSnapshot,
      trustScore: m.trustScore,
      consumerVerdictLabel: row.consumerVerdictLabel ?? m.verdictLabel,
      consumerVerdictBand: row.consumerVerdictBand ?? null,
      statusLabel: row.statusLabel,
      hasPublicPayloadV2: row.normalizedTrustScore != null,
      source: "latest-checks",
      mismatchStatusLabel: false,
      mismatchRiskTrust: detectRiskTrustMismatch(row.riskScoreSnapshot, m.trustScore)
    });

    return (
      <CompactOverviewFeedArticleCard
        model={m}
        headlineId={`latest-check-headline-${row.id}`}
        domainLine={domainLine}
        domainFullTitle={primaryLine.fullTitle || domainLine}
        href={safeCardHref(row)}
        viewLabel={ui.viewResultArrow}
        trustScorePillLabel={ui.trustScorePillLabel}
        trustScoreOutOf100Aria={ui.trustScoreOutOf100Aria}
        dataConfidenceAria={ui.dataConfidenceAria}
        domainEntityFallback={ui.entityLabels.domain.toUpperCase()}
        timeIso={iso}
        timeRelative={formatPublicCheckRelativeTime(iso)}
        timeTitle={
          row.lastSeenAt instanceof Date && !Number.isNaN(row.lastSeenAt.getTime())
            ? row.lastSeenAt.toUTCString()
            : ""
        }
        entityBadge={entityBadge(row.entityType, locale)}
        confidenceBadges={confidenceBadges}
      />
    );
  } catch (err) {
    console.warn("[latest-checks] skipped row", row.id, err instanceof Error ? err.message : err);
    return null;
  }
}

import type { Locale } from "@/lib/i18n/locales";

export type LatestChecksRenderProps = PageProps & { locale?: Locale };

export async function renderLatestChecksPage({ searchParams, locale = "en" }: LatestChecksRenderProps) {
  const ui = getDictionary(locale).latestChecksPage;
  const page = clampPage((await searchParams).page);
  const listBase = localizedPath("/latest-checks", locale);
  const skip = (page - 1) * PAGE_SIZE;

  const feed = await fetchLatestPublicChecksFeedPage(page, PAGE_SIZE);
  const { rows, loadFailed, hasNext } = feed;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = hasNext ? page + 1 : null;

  if (feed.skipped.length > 0 && process.env.NODE_ENV === "production") {
    console.info("[latest-checks] skipped rows while filling page", {
      page,
      skippedCount: feed.skipped.length,
      reasons: feed.skipped.slice(0, 5)
    });
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <LatestChecksJsonLd items={rows} positionOffset={skip} />
      <Navbar locale={locale} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:pt-10 md:pt-14">
        <LatestChecksHero />

        {loadFailed ? (
          <section
            aria-labelledby="latest-unavailable"
            className="mt-14 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-6 py-14 text-center shadow-sm md:mt-16 md:px-10"
          >
            <p id="latest-unavailable" className="mx-auto max-w-xl text-sm leading-relaxed text-amber-950">
              {ui.unavailableState}
            </p>
            <Link
              href={`${homeHref(locale)}#link-check`}
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {ui.ctaPrimary}
            </Link>
          </section>
        ) : rows.length === 0 ? (
          <section
            aria-labelledby="latest-empty"
            className="mt-14 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm md:mt-16 md:px-10"
          >
            <p id="latest-empty" className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
              {ui.emptyState}
            </p>
            <Link
              href={`${homeHref(locale)}#link-check`}
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {ui.ctaPrimary}
            </Link>
          </section>
        ) : (
          <section className="mt-12 md:mt-14" aria-labelledby="latest-list-heading">
            <h2 id="latest-list-heading" className="sr-only">
              {ui.listAria}
            </h2>
            <ol className="space-y-3 md:space-y-3.5">
              {rows.map((row) => (
                <li key={row.id}>
                  <LatestCheckListItem row={row} locale={locale} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {(prevPage !== null || nextPage !== null) && (rows.length > 0 || nextPage !== null) ? (
          <nav className="mt-8 border-t border-slate-200 pt-5" aria-label="Pagination">
            <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              {prevPage !== null ? (
                <Link
                  href={prevPage === 1 ? listBase : `${listBase}?page=${prevPage}`}
                  className="text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:decoration-blue-600"
                >
                  ← {ui.pagination.prev}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">{ui.pagination.prevDisabled}</span>
              )}
            </div>
            <div className="text-right">
              {nextPage !== null ? (
                <Link
                  href={`${listBase}?page=${nextPage}`}
                  className="text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:decoration-blue-600"
                >
                  {ui.pagination.next} →
                </Link>
              ) : (
                <span className="text-sm text-slate-400">{ui.pagination.nextDisabled}</span>
              )}
            </div>
            </div>

            {(() => {
              const start = Math.max(1, page - 2);
              const end = hasNext ? page + 2 : page;
              const pages: number[] = [];
              for (let p = start; p <= end; p += 1) pages.push(p);
              if (pages.length <= 1) return null;
              return (
                <ol className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Page numbers">
                  {pages.map((p) => (
                    <li key={p}>
                      {p === page ? (
                        <span
                          className="inline-flex min-w-[2.25rem] justify-center rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-900"
                          aria-current="page"
                        >
                          {p}
                        </span>
                      ) : (
                        <Link
                          href={p === 1 ? listBase : `${listBase}?page=${p}`}
                          className="inline-flex min-w-[2.25rem] justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm font-semibold text-blue-600 hover:border-slate-300 hover:bg-slate-50"
                        >
                          {p}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
              );
            })()}
          </nav>
        ) : null}
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

