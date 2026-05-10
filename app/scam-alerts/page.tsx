import type { Metadata } from "next";
import Link from "next/link";
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
import { SITE_URL } from "@/lib/seo";
import {
  getPublishedScamAlertsPageResult,
  getScamAlertsIndexStats,
  listPublishedScamTypes,
  SCAM_ALERTS_PAGE_SIZE
} from "@/lib/scam-alerts/service";

export const revalidate = 300;

const PAGE_DESCRIPTION =
  "Fraudly aggregates public scam intelligence—phishing, risky domains, and emerging fraud patterns—with calm explanations so you know what to double-check.";

type PageProps = {
  searchParams: Promise<{ type?: string; filter?: string; page?: string; time?: string }>;
};

function scamAlertsCanonicalPath(options: {
  page: number;
  time?: string;
  filter?: string;
  type?: string;
}): string {
  let filter = parseListFilterKey(options.filter);
  let timeWindow = parseScamAlertsTimeWindow(options.time);
  if (filter === "new-today") {
    filter = "all";
    timeWindow = "today";
  }
  const q = buildScamAlertsQuery({
    time: timeWindow === "today" ? undefined : timeWindow,
    filter: filter === "all" ? undefined : filter,
    type: options.type?.trim() || undefined,
    page: options.page > 1 ? options.page : undefined
  });
  return `${SITE_URL}/scam-alerts${q}`;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseScamAlertsPageParam(params.page);
  const canonical = scamAlertsCanonicalPath({
    page,
    time: typeof params.time === "string" ? params.time : undefined,
    filter: typeof params.filter === "string" ? params.filter : undefined,
    type: typeof params.type === "string" ? params.type : undefined
  });
  const title = page > 1 ? `Threat alerts · Page ${page} | Fraudly` : "Threat alerts | Fraudly";

  return {
    title,
    description: PAGE_DESCRIPTION,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: PAGE_DESCRIPTION,
      url: canonical,
      type: "website"
    }
  };
}

export default async function ScamAlertsPage({ searchParams }: PageProps) {
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

  const [types, pageResult, stats] = await Promise.all([
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

  const { alerts, total, page, pageSize, maxPage } = pageResult;
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : rangeStart + alerts.length - 1;

  let prevDomainKey: string | null = null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:pt-9">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">{EN_MESSAGES.scamAlertsUi.pageEyebrow}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight md:text-4xl">Scam &amp; phishing alerts</h1>
          <p className="mt-3 max-w-prose text-pretty text-base leading-relaxed text-slate-600">
            {EN_MESSAGES.scamAlertsUi.overviewIntro}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-700 sm:text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">{EN_MESSAGES.scamAlertsUi.explainChipRecentlyDetected}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">{EN_MESSAGES.scamAlertsUi.explainChipTrendingDomains}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">{EN_MESSAGES.scamAlertsUi.explainChipPhishing}</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">{EN_MESSAGES.scamAlertsUi.explainChipSuspiciousDomains}</span>
          </div>
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-600">{EN_MESSAGES.scamAlertsUi.chipHint}</p>
          <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
            Fraudly aggregates third-party intelligence. Treat every alert as encouragement to verify—not as proof by itself.
          </p>
        </header>

        <ScamAlertsSummaryStrip stats={stats} filteredTotal={total} rangeStart={rangeStart} rangeEnd={rangeEnd} />

        <div className="mt-5">
          <ScamAlertsFilterBar activeFilter={filter} activeTime={timeWindow} selectedType={selectedType} types={types} />
        </div>

        {alerts.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              {stats.total === 0 ? "No published scam alerts yet." : "No alerts match this filter."}
            </h2>
            <p className="mt-2 mx-auto max-w-lg text-sm text-slate-600">
              {stats.total === 0
                ? "Fraudly publishes alerts when public threat feeds contain high-confidence indicators. Check back soon as feeds update."
                : timeWindow === "today"
                  ? "Nothing was published yet today (UTC). Try Last 24h, Last 7 days, or All alerts—or widen severity filters."
                  : "Try a different time range or severity filter. Totals above still reflect all published alerts."}
            </p>
            {stats.total > 0 && timeWindow === "today" ? (
              <p className="mt-3 text-center text-sm">
                <Link
                  href={`/scam-alerts${buildScamAlertsQuery({ time: "7d", filter: filter === "all" ? undefined : filter, type: selectedType || undefined })}`}
                  className="font-semibold text-blue-700 underline-offset-2 hover:underline"
                >
                  View last 7 days
                </Link>
              </p>
            ) : null}
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              Check a website now
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
      <SiteFooter />
    </div>
  );
}
