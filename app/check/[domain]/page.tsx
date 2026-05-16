import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import { parseCheckDomainParam } from "@/lib/domainPage";
import {
  buildWebsiteCheckMetaDescription,
  SEO_DESCRIPTION,
  SEO_TITLE,
  warnMetaDescriptionIfNeeded
} from "@/lib/seo-description";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { publicRobots, SITE_URL, unindexedFollowRobots } from "@/lib/seo";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";
import { SiteFooter } from "@/components/SiteFooter";
import { DomainCheckJsonLd } from "@/components/seo/DomainCheckJsonLd";
import { EN_MESSAGES } from "@/lib/messages.en";
import { getCachedResolveLatestPublicCheckSnapshotForCheckPage } from "@/lib/latest-public-checks/snapshot";
import { alignedDisplayFromSnapshot } from "@/lib/check/alignedDisplayFromSnapshot";
import type { CheckResultRouteSource } from "@/lib/check/checkResultHref";
import { logCheckDetailPerf } from "@/lib/check/checkDetailPerfLog";
import { logDisplayScoreDebug } from "@/lib/scoring/displayScore";
import { CheckSummaryDl } from "@/components/check/CheckSummaryDl";
import { CheckResultLoader } from "@/components/check/CheckResultLoader";
import { CheckResultCardSkeleton, CheckSummarySkeleton } from "@/components/check/CheckResultSkeleton";
import type { ScamCheckResult } from "@/types/scam";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ domain: string }>;
  searchParams: Promise<{ scanId?: string; from?: string }>;
};

function parseRouteSource(from: string | undefined): CheckResultRouteSource | "unknown" {
  if (from === "latest-card" || from === "recent" || from === "direct") return from;
  return "unknown";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) {
    return {
      title: SEO_TITLE.checkInvalid,
      description: SEO_DESCRIPTION.scanResult,
      robots: unindexedFollowRobots
    };
  }

  const path = `/check/${encodeURIComponent(domain)}`;
  const canonical = `${SITE_URL}${path}`;
  const scanId = typeof (await searchParams).scanId === "string" ? (await searchParams).scanId : undefined;

  const publicSnapshot = await getCachedResolveLatestPublicCheckSnapshotForCheckPage(domain, scanId);

  if (publicSnapshot) {
    const trustScore = publicSnapshot.display.trustScore;
    const reviewSummary = publicSnapshot.storedResult?.reviewSummary;
    const description = buildWebsiteCheckMetaDescription(domain, trustScore, reviewSummary ?? undefined);
    warnMetaDescriptionIfNeeded(path, description);
    const title = SEO_TITLE.checkResult(domain);
    const sharingTitle = `${title} | Fraudly`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        url: canonical,
        title: sharingTitle,
        description,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: sharingTitle,
        description,
        images: [OG_IMAGE.url]
      },
      robots: publicRobots
    };
  }

  try {
    const result = await getCachedWebsiteAnalysis(domain);
    const trustScore = displayTrustScoreForResult(result);
    const description = buildWebsiteCheckMetaDescription(domain, trustScore, result.reviewSummary);
    warnMetaDescriptionIfNeeded(path, description);
    const title = SEO_TITLE.checkResult(domain);
    const sharingTitle = `${title} | Fraudly`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        url: canonical,
        title: sharingTitle,
        description,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: sharingTitle,
        description,
        images: [OG_IMAGE.url]
      },
      robots: publicRobots
    };
  } catch {
    const fallback = buildWebsiteCheckMetaDescription(domain, null);
    warnMetaDescriptionIfNeeded(path, fallback);
    const title = SEO_TITLE.checkResult(domain);
    const sharingTitle = `${title} | Fraudly`;
    return {
      title,
      description: fallback,
      alternates: { canonical },
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        url: canonical,
        title: sharingTitle,
        description: fallback,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: sharingTitle,
        description: fallback,
        images: [OG_IMAGE.url]
      },
      robots: publicRobots
    };
  }
}

export default async function DomainCheckPage({ params, searchParams }: PageProps) {
  const pageStart = performance.now();
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) notFound();

  const sp = await searchParams;
  const scanId = typeof sp.scanId === "string" ? sp.scanId : undefined;
  const routeSource = parseRouteSource(typeof sp.from === "string" ? sp.from : undefined);

  const snapshotStart = performance.now();
  const publicSnapshot = await getCachedResolveLatestPublicCheckSnapshotForCheckPage(domain, scanId);
  const snapshotFetchMs = Math.round(performance.now() - snapshotStart);

  const path = `/check/${encodeURIComponent(domain)}`;
  const storedResult: ScamCheckResult | null = publicSnapshot?.storedResult ?? null;
  const alignedDisplay = publicSnapshot ? alignedDisplayFromSnapshot(publicSnapshot) : undefined;
  const trustScore = publicSnapshot?.display.trustScore ?? null;

  if (publicSnapshot) {
    logDisplayScoreDebug({
      domain,
      scanId: publicSnapshot.id,
      storedRiskScore: publicSnapshot.display.riskScore,
      storedTrustScore: publicSnapshot.display.trustScore,
      displayedTrustScore: publicSnapshot.display.trustScore,
      displayedLabel: publicSnapshot.display.label,
      source: "check/[domain]/page"
    });
  }

  logCheckDetailPerf({
    routeSource: routeSource === "unknown" && scanId ? "latest-card" : routeSource,
    domain,
    scanId: scanId ?? publicSnapshot?.id ?? null,
    snapshotFetchMs,
    resultSource: storedResult ? "stored-payload" : "pending",
    totalPageMs: Math.round(performance.now() - pageStart)
  });

  const resultBlock = storedResult ? (
    <>
      <CheckSummaryDl trustScore={trustScore} result={storedResult} />
      <div className="mt-8 max-w-4xl">
        <ResultCard result={storedResult} alignedDisplay={alignedDisplay} />
      </div>
    </>
  ) : (
    <Suspense
      fallback={
        <>
          <CheckSummarySkeleton trustScore={trustScore ?? undefined} />
          <CheckResultCardSkeleton />
        </>
      }
    >
      <CheckResultLoader
        domain={domain}
        alignedDisplay={alignedDisplay}
        routeSource={routeSource === "unknown" && scanId ? "latest-card" : routeSource}
        scanId={scanId ?? publicSnapshot?.id}
        snapshotTrustScore={trustScore}
      />
    </Suspense>
  );

  const jsonLdResult = storedResult;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      {jsonLdResult ? <DomainCheckJsonLd domain={domain} pathname={path} result={jsonLdResult} /> : null}
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <nav className="text-sm text-slate-600" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="font-medium text-blue-600 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/#link-check" className="font-medium text-blue-600 hover:underline">
                Check a website
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-slate-900">{domain}</li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Website trust check</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Is {domain} safe to use?
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
            Below is an automated, evidence-based snapshot of <span className="font-medium text-slate-800">{domain}</span>{" "}
            showing risk indicators, trust signals, and technical checks. Results are not legal or financial advice and are
            not a guarantee that a site is safe or unsafe.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Looking for the long-form trust guide (FAQs, scam vs. legit framing)?{" "}
            <Link
              href={`/domain/${encodeURIComponent(domain)}`}
              className="font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2 hover:text-blue-800"
            >
              Open the {domain} trust intelligence page
            </Link>
            .
          </p>
        </header>

        <section className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p>
            <strong className="font-semibold">Snapshot only.</strong> Data comes from public feeds, technical checks, and
            limited page context. Phishing and scam sites change quickly—use your judgment and official channels when in
            doubt.
          </p>
        </section>

        {resultBlock}

        <section className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap" aria-label="Next steps">
          <Link
            href="/#link-check"
            className="inline-flex justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
          >
            Check another website
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            How Fraudly works
          </Link>
          <Link
            href="/learn"
            className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Learn about scam websites
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
