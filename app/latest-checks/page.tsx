import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { LatestCheckWatchCell } from "@/components/latest-checks/LatestCheckWatchCell";
import { LatestChecksJsonLd } from "@/components/seo/LatestChecksJsonLd";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { formatPublicCheckRelativeTime } from "@/lib/latest-public-checks/relative-time";
import { db } from "@/lib/db";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { EN_MESSAGES } from "@/lib/messages.en";
import { SITE_URL } from "@/lib/seo";
import { trustIconGlyph, trustPresentationFromScore, trustScoreFromRisk } from "@/lib/trustSystem";

export const revalidate = 120;

const PAGE_SIZE = 24;

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
      "See recently checked domains, URLs, companies, usernames, and crypto wallets with fraud risk scores.",
    alternates: { canonical },
    robots: { index: true, follow: true },
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

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-14">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-blue-700">{EN_MESSAGES.latestChecks.overline}</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {EN_MESSAGES.latestChecks.pageTitle}
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">{EN_MESSAGES.latestChecks.intro}</p>
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
          <section className="mt-10" aria-labelledby="latest-list-heading">
            <h2 id="latest-list-heading" className="sr-only">
              {EN_MESSAGES.latestChecks.listAria}
            </h2>
            <ol className="space-y-3">
              {rows.map((row) => (
                <li key={row.id}>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md md:p-5">
                    {(() => {
                      const trustScore = trustScoreFromRisk(row.riskScoreSnapshot);
                      const trust = trustPresentationFromScore(trustScore);
                      return (
                        <>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {entityBadge(row.entityType)}
                          </span>
                          <time
                            className="text-xs text-slate-500"
                            dateTime={row.lastSeenAt.toISOString()}
                            title={row.lastSeenAt.toUTCString()}
                          >
                            {formatPublicCheckRelativeTime(row.lastSeenAt.toISOString())}
                          </time>
                        </div>
                        <p className="mt-2 break-all text-sm font-semibold leading-snug text-slate-900 md:text-base">
                          {row.checkedValue}
                        </p>
                      </div>
                      <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-700 md:text-right md:text-sm">
                        <div className="md:col-span-2">
                          <dt className="sr-only">{EN_MESSAGES.latestChecks.labels.risk}</dt>
                          <dd className="flex items-center gap-2 md:justify-end">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${trust.toneSoftBorder} ${trust.toneSoftBg} ${trust.toneText}`}>
                              <span aria-hidden>{trustIconGlyph(trust.icon)}</span>
                              {trust.label}
                            </span>
                            <span className={`font-semibold tabular-nums ${trust.toneText}`}>{trustScore}/100</span>
                          </dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="sr-only">{EN_MESSAGES.latestChecks.labels.status}</dt>
                          <dd className="text-slate-600">Unified trust system</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full ${trust.progressBar}`} style={{ width: `${trustScore}%` }} />
                    </div>
                    <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <LatestCheckWatchCell
                        entityType={row.entityType}
                        normalizedKey={row.normalizedValue}
                        checkedValue={row.checkedValue}
                        publicResultPath={row.publicResultPath}
                        riskScoreSnapshot={row.riskScoreSnapshot}
                      />
                      <Link
                        href={row.publicResultPath}
                        className="inline-flex shrink-0 justify-center rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 md:text-sm"
                      >
                        {EN_MESSAGES.latestChecks.viewSnapshot}
                      </Link>
                    </div>
                        </>
                      );
                    })()}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(prevPage !== null || nextPage !== null) && rows.length > 0 ? (
          <nav className="mt-10 flex items-center justify-between gap-4 border-t border-slate-200 pt-6" aria-label="Pagination">
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
