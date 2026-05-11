import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { LatestChecksJsonLd } from "@/components/seo/LatestChecksJsonLd";
import { CompactOverviewFeedLinkCard } from "@/components/overview/CompactOverviewFeedCard";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { db } from "@/lib/db";
import { overviewFeedPrimaryLine } from "@/lib/overviewFeedDisplay";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { EN_MESSAGES } from "@/lib/messages.en";
import { publicRobots, SITE_URL } from "@/lib/seo";
import { buildOverviewFromPublicCheck } from "@/lib/overviewCardPresentation";

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
    page > 1 ? `Latest Fraud Checks (page ${page})` : EN_MESSAGES.latestChecks.pageTitle;
  const sharingTitle = `${titleSegment} | Fraudly`;
  const canonical =
    page > 1 ? `${SITE_URL}/latest-checks?page=${page}` : `${SITE_URL}/latest-checks`;

  return {
    title: titleSegment,
    description:
      "Explore recent community website checks powered by Fraudly trust signals, scam intelligence, reputation data, and AI-assisted analysis—shown as privacy-safe summaries.",
    alternates: { canonical },
    robots: publicRobots,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Fraudly",
      locale: "en_US",
      title: sharingTitle,
      description:
        "See recently checked domains and websites with Fraudly fraud risk snapshots (anonymized, public summaries).",
      images: [OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description:
        "See recently checked domains and websites with Fraudly fraud risk snapshots (anonymized, public summaries).",
      images: [OG_IMAGE.url]
    }
  };
}

function entityBadge(type: string): string {
  const labels = EN_MESSAGES.latestChecks.entityLabels;
  const k = type as keyof typeof labels;
  return k in labels ? labels[k] : EN_MESSAGES.latestChecks.entityFallback;
}

async function fetchLatestPublicChecks(skip: number, take: number) {
  try {
    return await db.latestPublicCheck.findMany({
      orderBy: { lastSeenAt: "desc" },
      skip,
      take
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2021" || err.code === "P1001")
    ) {
      console.warn("[latest-checks] prisma read skipped:", err.code, err.message);
      return [];
    }
    throw err;
  }
}

export default async function LatestChecksPage({ searchParams }: PageProps) {
  const page = clampPage((await searchParams).page);
  const skip = (page - 1) * PAGE_SIZE;

  const batch = await fetchLatestPublicChecks(skip, PAGE_SIZE + 1);

  const hasNext = batch.length > PAGE_SIZE;
  const rows = hasNext ? batch.slice(0, PAGE_SIZE) : batch;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = hasNext ? page + 1 : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <LatestChecksJsonLd items={rows} positionOffset={skip} />
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 pb-14 pt-7 sm:pt-9 md:pt-12">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">{EN_MESSAGES.latestChecks.overline}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {EN_MESSAGES.latestChecks.pageTitle}
          </h1>
          <p className="mt-4 max-w-prose text-pretty text-base leading-relaxed text-slate-600">{EN_MESSAGES.latestChecks.intro}</p>
          <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-slate-600">{EN_MESSAGES.latestChecks.scoreExplainerFootnote}</p>
        </header>

        {rows.length === 0 ? (
          <section
            aria-labelledby="latest-empty"
            className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm md:px-10"
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
          <section className="mt-8" aria-labelledby="latest-list-heading">
            <h2 id="latest-list-heading" className="sr-only">
              {EN_MESSAGES.latestChecks.listAria}
            </h2>
            <ol className="space-y-3 md:space-y-4">
              {rows.map((row) => {
                const m = buildOverviewFromPublicCheck(row);
                const iso = row.lastSeenAt.toISOString();
                const primaryLine = overviewFeedPrimaryLine(row.checkedValue);
                return (
                <li key={row.id}>
                  <CompactOverviewFeedLinkCard
                    model={m}
                    headlineId={`latest-check-headline-${row.id}`}
                    domainLine={primaryLine.primary}
                    domainFullTitle={primaryLine.fullTitle}
                    href={row.publicResultPath}
                    viewLabel={EN_MESSAGES.latestChecks.viewResultArrow}
                    timeIso={iso}
                    timeRelative={formatPublicCheckRelativeTime(iso)}
                    timeTitle={row.lastSeenAt.toUTCString()}
                    entityBadge={entityBadge(row.entityType)}
                  />
                </li>
                );
              })}
            </ol>
          </section>
        )}

        {(prevPage !== null || nextPage !== null) && rows.length > 0 ? (
          <nav className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-5" aria-label="Pagination">
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
