import type { Metadata } from "next";
import Link from "next/link";
import { ScamAlertCard } from "@/components/scam-alerts/ScamAlertCard";
import { ScamAlertsFilterBar } from "@/components/scam-alerts/ScamAlertsFilterBar";
import { ScamAlertsPagination } from "@/components/scam-alerts/ScamAlertsPagination";
import { ScamAlertsSummaryStrip } from "@/components/scam-alerts/ScamAlertsSummaryStrip";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { clusterDomainKey, parseListFilterKey, parseScamAlertsPageParam } from "@/lib/scam-alerts/presentation";
import { SITE_URL } from "@/lib/seo";
import {
  getPublishedScamAlertsPageResult,
  getScamAlertsIndexStats,
  listPublishedScamTypes,
  SCAM_ALERTS_PAGE_SIZE
} from "@/lib/scam-alerts/service";

export const revalidate = 300;

const PAGE_DESCRIPTION =
  "Consumer-friendly scam and phishing alerts from public threat feeds—what changed, why it matters, and how to stay safe.";

type PageProps = {
  searchParams: Promise<{ type?: string; filter?: string; page?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseScamAlertsPageParam(params.page);
  const canonical = page <= 1 ? `${SITE_URL}/scam-alerts` : `${SITE_URL}/scam-alerts?page=${page}`;
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
  const filter = parseListFilterKey(params.filter);
  const requestedPage = parseScamAlertsPageParam(params.page);

  const [types, pageResult, stats] = await Promise.all([
    listPublishedScamTypes(now),
    getPublishedScamAlertsPageResult({
      filter,
      exactScamType: selectedType || undefined,
      page: requestedPage,
      pageSize: SCAM_ALERTS_PAGE_SIZE,
      now
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
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Threat intelligence</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Scam &amp; phishing alerts</h1>
          <p className="mt-3 text-base text-slate-600">
            Plain-language summaries of what public feeds are flagging right now—so you can scan risks quickly and dig
            into details only when you need them.
          </p>
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Fraudly aggregates third-party signals. Treat every alert as a hint to double-check, not proof by itself.
          </p>
        </header>

        <ScamAlertsSummaryStrip stats={stats} filteredTotal={total} rangeStart={rangeStart} rangeEnd={rangeEnd} />

        <div className="mt-6">
          <ScamAlertsFilterBar activeFilter={filter} selectedType={selectedType} types={types} />
        </div>

        {alerts.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              {stats.total === 0 ? "No published scam alerts yet." : "No alerts match this filter."}
            </h2>
            <p className="mt-2 mx-auto max-w-lg text-sm text-slate-600">
              {stats.total === 0
                ? "Fraudly publishes alerts when public threat feeds contain high-confidence indicators. Check back soon as feeds update."
                : "Try clearing filters or picking a different option. Totals above still reflect everything published."}
            </p>
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              Check a website now
            </Link>
          </section>
        ) : (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Published alerts">
              {alerts.map((alert) => {
                const key = clusterDomainKey(alert.domain);
                const showRelated = Boolean(key && prevDomainKey === key);
                if (key) prevDomainKey = key;
                else prevDomainKey = null;
                return <ScamAlertCard key={alert.id} alert={alert} now={now} showRelatedHint={showRelated} />;
              })}
            </section>
            <ScamAlertsPagination filter={filter} selectedType={selectedType} page={page} maxPage={maxPage} />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
