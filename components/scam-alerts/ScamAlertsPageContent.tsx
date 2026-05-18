import Link from "next/link";
import { ScamAlertsPageHeader } from "@/components/scam-alerts/ScamAlertsPageHeader";
import { ScamAlertCard } from "@/components/scam-alerts/ScamAlertCard";
import { ScamAlertsFilterBar } from "@/components/scam-alerts/ScamAlertsFilterBar";
import { ScamAlertsPagination } from "@/components/scam-alerts/ScamAlertsPagination";
import { ScamAlertsSummaryStrip } from "@/components/scam-alerts/ScamAlertsSummaryStrip";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import {
  buildScamAlertsQuery,
  clusterDomainKey,
  type ListFilterKey,
  parseListFilterKey,
  parseScamAlertsPageParam,
  parseScamAlertsTimeWindow
} from "@/lib/scam-alerts/presentation";
import { EN_MESSAGES } from "@/lib/messages.en";
import type { Locale } from "@/lib/i18n/locales";
import {
  getPublishedScamAlertsPageResult,
  getScamAlertsIndexStats,
  listPublishedScamTypes,
  SCAM_ALERTS_PAGE_SIZE
} from "@/lib/scam-alerts/service";

export type ScamAlertsPageContentProps = {
  searchParams: Promise<{ type?: string; filter?: string; page?: string; time?: string }>;
  locale?: Locale;
};

export async function ScamAlertsPageContent({ searchParams, locale = "en" }: ScamAlertsPageContentProps) {
  const params = await searchParams;
  const now = new Date();
  const selectedType = typeof params.type === "string" ? params.type : "";
  let filter: ListFilterKey = parseListFilterKey(params.filter);
  let timeWindow = parseScamAlertsTimeWindow(typeof params.time === "string" ? params.time : undefined);
  if (filter === "new-today") {
    filter = "all";
    timeWindow = "today";
  }
  const requestedPage = parseScamAlertsPageParam(params.page);

  const emptyPageResult = {
    alerts: [] as Awaited<ReturnType<typeof getPublishedScamAlertsPageResult>>["alerts"],
    total: 0,
    page: 1,
    pageSize: SCAM_ALERTS_PAGE_SIZE,
    maxPage: 1
  };
  const emptyStats = {
    total: 0,
    elevatedConfidenceCount: 0,
    newTodayCount: 0,
    topScamType: null as string | null
  };

  let types: string[] = [];
  let pageResult = emptyPageResult;
  let stats = emptyStats;

  try {
    [types, pageResult, stats] = await Promise.all([
      listPublishedScamTypes(now),
      getPublishedScamAlertsPageResult({
        filter,
        exactScamType: selectedType || undefined,
        page: requestedPage,
        pageSize: SCAM_ALERTS_PAGE_SIZE,
        now,
        timeWindow
      }),
      getScamAlertsIndexStats(now)
    ]);
  } catch (err) {
    console.error("[scam-alerts] page load failed", err);
  }

  const { alerts, total, page, pageSize, maxPage } = pageResult;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : rangeStart + alerts.length - 1;

  let prevDomainKey: string | null = null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar locale={locale} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:pt-9">
        <ScamAlertsPageHeader />

        <ScamAlertsSummaryStrip stats={stats} filteredTotal={total} rangeStart={rangeStart} rangeEnd={rangeEnd} />

        <div className="mt-5">
          <ScamAlertsFilterBar activeFilter={filter} activeTime={timeWindow} selectedType={selectedType} types={types} />
        </div>

        {alerts.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              {stats.total === 0
                ? EN_MESSAGES.scamAlertsUi.emptyStateZeroTitle
                : EN_MESSAGES.scamAlertsUi.emptyStateFilteredTitle}
            </h2>
            <p className="mt-2 mx-auto max-w-lg text-sm leading-relaxed text-slate-600">
              {stats.total === 0 ? EN_MESSAGES.scamAlertsUi.emptyStateZeroBody : EN_MESSAGES.scamAlertsUi.emptyStateFilteredBody}
            </p>
            {stats.total > 0 && timeWindow !== "all" ? (
              <p className="mt-3 text-center text-sm">
                <Link
                  href={`/scam-alerts${buildScamAlertsQuery({
                    time: "all",
                    filter: filter === "all" ? undefined : filter,
                    type: selectedType || undefined
                  })}`}
                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                >
                  {EN_MESSAGES.scamAlertsUi.emptyStateViewAllTimeCta}
                </Link>
              </p>
            ) : null}
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {EN_MESSAGES.scamAlertsUi.emptyStateCheckWebsiteCta}
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-7 grid auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Published alerts">
              {alerts.map((alert) => {
                const key = clusterDomainKey(alert.domain);
                const showRelated = Boolean(key && prevDomainKey === key);
                if (key) prevDomainKey = key;
                else prevDomainKey = null;
                return <ScamAlertCard key={alert.id} alert={alert} now={now} showRelatedHint={showRelated} />;
              })}
            </section>
            <ScamAlertsPagination filter={filter} time={timeWindow} selectedType={selectedType} page={page} maxPage={maxPage} />
          </>
        )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
