import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
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
import { getLatestPublicCheckSnapshotForDomain } from "@/lib/latest-public-checks/snapshot";
import { buildOverviewFromTrustAndVerdict } from "@/lib/overviewCardPresentation";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";
import { logDisplayScoreDebug } from "@/lib/scoring/displayScore";
import type { HumanRecKind } from "@/lib/scanResultDualLayer";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
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

  try {
    const [result, publicSnapshot] = await Promise.all([
      getCachedWebsiteAnalysis(domain),
      getLatestPublicCheckSnapshotForDomain(domain)
    ]);
    const liveTrust = displayTrustScoreForResult(result);
    const trustScore = publicSnapshot?.display.trustScore ?? liveTrust;
    if (publicSnapshot) {
      logDisplayScoreDebug({
        domain,
        scanId: publicSnapshot.id,
        storedRiskScore: publicSnapshot.display.riskScore,
        storedTrustScore: publicSnapshot.display.trustScore,
        displayedTrustScore: trustScore,
        displayedLabel: publicSnapshot.display.label,
        source: "check/[domain]/generateMetadata"
      });
    }
    const title = SEO_TITLE.checkResult(domain);
    const description = buildWebsiteCheckMetaDescription(domain, trustScore, result.reviewSummary);
    warnMetaDescriptionIfNeeded(path, description);
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

export default async function DomainCheckPage({ params }: PageProps) {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) notFound();

  const path = `/check/${encodeURIComponent(domain)}`;
  let result;
  let publicSnapshot;
  try {
    [result, publicSnapshot] = await Promise.all([
      getCachedWebsiteAnalysis(domain),
      getLatestPublicCheckSnapshotForDomain(domain)
    ]);
  } catch {
    notFound();
  }

  const liveTrust = displayTrustScoreForResult(result);
  const trustScore = publicSnapshot?.display.trustScore ?? liveTrust;

  let alignedDisplay:
    | {
        trustScore: number;
        label: string;
        humanKind: HumanRecKind;
        humanHeadline: string;
        scanId: string;
        lastSeenAtIso: string;
      }
    | undefined;

  if (publicSnapshot) {
    const overview = buildOverviewFromTrustAndVerdict(
      publicSnapshot.display.trustScore,
      publicSnapshot.display.verdict
    );
    alignedDisplay = {
      trustScore: overview.trustScore,
      label: overview.verdictLabel,
      humanKind: overview.humanKind,
      humanHeadline: overview.headline,
      scanId: publicSnapshot.id,
      lastSeenAtIso: publicSnapshot.lastSeenAt.toISOString()
    };
    logDisplayScoreDebug({
      domain,
      scanId: publicSnapshot.id,
      storedRiskScore: publicSnapshot.display.riskScore,
      storedTrustScore: publicSnapshot.display.trustScore,
      displayedTrustScore: overview.trustScore,
      displayedLabel: overview.verdictLabel,
      source: "check/[domain]/page"
    });
  } else if (process.env.NODE_ENV === "development" && liveTrust !== null) {
    logDisplayScoreDebug({
      domain,
      scanId: null,
      storedRiskScore: result.score,
      storedTrustScore: liveTrust,
      displayedTrustScore: liveTrust,
      displayedLabel: "(live analysis, no public snapshot)",
      source: "check/[domain]/page"
    });
  }
  const sslShort = result.ssl.httpsEnabled
    ? result.ssl.validCertificate
      ? "HTTPS available — encrypts transit, does not prove legitimacy"
      : "HTTPS with certificate issues"
    : "No HTTPS";

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <DomainCheckJsonLd domain={domain} pathname={path} result={result} />
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

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust-style score</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">
              {trustScore === null ? EN_MESSAGES.siteOutcome.suppressedTrustMeter : `${trustScore} / 100`}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain age (days)</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">{result.domainIntelligence.ageDays ?? "—"}</dd>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SSL / HTTPS</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{sslShort}</dd>
          </div>
        </dl>

        <div className="mt-8 max-w-4xl">
          <ResultCard result={result} alignedDisplay={alignedDisplay} />
        </div>

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
