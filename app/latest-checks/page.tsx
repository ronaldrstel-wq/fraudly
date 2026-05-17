import type { Metadata } from "next";
import Link from "next/link";
import { LatestChecksJsonLd } from "@/components/seo/LatestChecksJsonLd";
import { LatestChecksHero } from "@/components/latest-checks/LatestChecksHero";
import { CompactOverviewFeedArticleCard } from "@/components/overview/CompactOverviewFeedCard";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { EN_MESSAGES } from "@/lib/messages.en";
import { SEO_DESCRIPTION, SEO_TITLE, warnMetaDescriptionIfNeeded } from "@/lib/seo-description";
import { publicRobots, SITE_URL } from "@/lib/seo";
import { checkResultHref } from "@/lib/check/checkResultHref";
import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";
import { logDisplayScoreDebug } from "@/lib/scoring/displayScore";
import {
  fetchLatestPublicChecksPage,
  type LatestPublicCheckListRow
} from "@/lib/latest-public-checks/listPublicChecks";

export const revalidate = 120;

const PAGE_SIZE = 10;

type PageProps = { searchParams: Promise<{ page?: string }> };

function clampPage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 500);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const page = clampPage((await searchParams).page);
  const titleSegment =
    page > 1 ? `${SEO_TITLE.latestChecks} (page ${page})` : SEO_TITLE.latestChecks;
  const sharingTitle = `${titleSegment} | Fraudly`;
  const canonical =
    page > 1 ? `${SITE_URL}/latest-checks?page=${page}` : `${SITE_URL}/latest-checks`;

  const description = SEO_DESCRIPTION.latestChecks;
  warnMetaDescriptionIfNeeded(page > 1 ? `/latest-checks?page=${page}` : "/latest-checks", description);

  return {
    title: titleSegment,
    description,
    alternates: { canonical },
    robots: publicRobots,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      title: sharingTitle,
      description,
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description,
      images: [OG_IMAGE.url]
    }
  };
}

function entityBadge(type: string | null | undefined): string {
  const labels = EN_MESSAGES.latestChecks.entityLabels;
  if (!type) return EN_MESSAGES.latestChecks.entityFallback;
  const k = type as keyof typeof labels;
  return k in labels ? labels[k] : EN_MESSAGES.latestChecks.entityFallback;
}

function safeLastSeenIso(lastSeenAt: Date): string {
  if (!(lastSeenAt instanceof Date) || Number.isNaN(lastSeenAt.getTime())) {
    return new Date(0).toISOString();
  }
  return lastSeenAt.toISOString();
}

function safeCardHref(row: LatestPublicCheckListRow): string {
  const primary = overviewFeedPrimaryLine(row.checkedValue ?? row.normalizedValue).primary;
  const domain = primary || row.normalizedValue || "unknown";
  try {
    return checkResultHref(domain, { scanId: row.id, from: "latest-card" });
  } catch {
    return row.publicResultPath?.startsWith("/check/")
      ? row.publicResultPath
      : `/check/${encodeURIComponent(domain)}`;
  }
}

function LatestCheckListItem({ row }: { row: LatestPublicCheckListRow }) {
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
    const domainLine = primaryLine.primary || row.normalizedValue || EN_MESSAGES.latestChecks.entityFallback;

    return (
      <CompactOverviewFeedArticleCard
        model={m}
        headlineId={`latest-check-headline-${row.id}`}
        domainLine={domainLine}
        domainFullTitle={primaryLine.fullTitle || domainLine}
        href={safeCardHref(row)}
        viewLabel={EN_MESSAGES.latestChecks.viewResultArrow}
        timeIso={iso}
        timeRelative={formatPublicCheckRelativeTime(iso)}
        timeTitle={
          row.lastSeenAt instanceof Date && !Number.isNaN(row.lastSeenAt.getTime())
            ? row.lastSeenAt.toUTCString()
            : ""
        }
        entityBadge={entityBadge(row.entityType)}
      />
    );
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[latest-checks] skipped row", row.id, err);
    }
    return null;
  }
}

export default async function LatestChecksPage({ searchParams }: PageProps) {
  const page = clampPage((await searchParams).page);
  const skip = (page - 1) * PAGE_SIZE;

  const { rows: batch, loadFailed } = await fetchLatestPublicChecksPage(skip, PAGE_SIZE + 1);

  const hasNext = !loadFailed && batch.length > PAGE_SIZE;
  const rows = loadFailed ? [] : hasNext ? batch.slice(0, PAGE_SIZE) : batch;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = hasNext ? page + 1 : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <LatestChecksJsonLd items={rows} positionOffset={skip} />
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-8 sm:pt-10 md:pt-14">
        <LatestChecksHero />

        {loadFailed ? (
          <section
            aria-labelledby="latest-unavailable"
            className="mt-14 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-6 py-14 text-center shadow-sm md:mt-16 md:px-10"
          >
            <p id="latest-unavailable" className="mx-auto max-w-xl text-sm leading-relaxed text-amber-950">
              {EN_MESSAGES.latestChecks.unavailableState}
            </p>
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {EN_MESSAGES.latestChecks.ctaPrimary}
            </Link>
          </section>
        ) : rows.length === 0 ? (
          <section
            aria-labelledby="latest-empty"
            className="mt-14 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm md:mt-16 md:px-10"
          >
            <p id="latest-empty" className="mx-auto max-w-xl text-sm leading-relaxed text-slate-600">
              {EN_MESSAGES.latestChecks.emptyState}
            </p>
            <Link
              href="/#link-check"
              className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:brightness-110"
            >
              {EN_MESSAGES.latestChecks.ctaPrimary}
            </Link>
          </section>
        ) : (
          <section className="mt-12 md:mt-14" aria-labelledby="latest-list-heading">
            <h2 id="latest-list-heading" className="sr-only">
              {EN_MESSAGES.latestChecks.listAria}
            </h2>
            <ol className="space-y-3 md:space-y-3.5">
              {rows.map((row) => (
                <li key={row.id}><LatestCheckListItem row={row} /></li>
              ))}
            </ol>
          </section>
        )}

        {(prevPage !== null || nextPage !== null) && rows.length > 0 ? (
          <nav
            className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-5"
            aria-label="Pagination"
          >
            <div className="min-w-0">
              {prevPage !== null ? (
                <Link
                  href={prevPage === 1 ? "/latest-checks" : `/latest-checks?page=${prevPage}`}
                  className="text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:decoration-blue-600"
                >
                  ← {EN_MESSAGES.latestChecks.paginationPrev}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">{EN_MESSAGES.latestChecks.paginationPrevDisabled}</span>
              )}
            </div>
            <p className="text-center text-xs text-slate-500">
              {EN_MESSAGES.latestChecks.paginationPage}: {page}
            </p>
            <div className="text-right">
              {nextPage !== null ? (
                <Link
                  href={`/latest-checks?page=${nextPage}`}
                  className="text-sm font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:decoration-blue-600"
                >
                  {EN_MESSAGES.latestChecks.paginationNext} →
                </Link>
              ) : (
                <span className="text-sm text-slate-400">{EN_MESSAGES.latestChecks.paginationNextDisabled}</span>
              )}
            </div>
          </nav>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
