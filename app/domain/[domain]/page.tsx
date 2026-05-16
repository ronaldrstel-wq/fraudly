import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import {
  domainLandingFaq,
  domainLandingIntro,
  domainLandingMetaDescription,
  domainLandingTitleSegment
} from "@/lib/domainIntelLandingCopy";
import { parseCheckDomainParam } from "@/lib/domainPage";
import { SEO_DESCRIPTION } from "@/lib/seo-description";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, publicRobots, SITE_URL, unindexedFollowRobots } from "@/lib/seo";
import { DomainIntelLandingJsonLd } from "@/components/seo/DomainIntelLandingJsonLd";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";
import { SiteFooter } from "@/components/SiteFooter";
import { EN_MESSAGES } from "@/lib/messages.en";
import { DomainAgeMetricValue } from "@/components/check/DomainAgeMetricValue";
import { formatSslHighlightValue } from "@/lib/signals/trustHighlightFacts";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ domain: string }>;
};

function domainPathname(domain: string): string {
  return `/domain/${encodeURIComponent(domain)}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) {
    return {
      title: "Website trust intelligence",
      description: SEO_DESCRIPTION.domainIntelFallback,
      robots: unindexedFollowRobots
    };
  }

  const path = domainPathname(domain);
  const canonical = `${SITE_URL}${path}`;

  try {
    const result = await getCachedWebsiteAnalysis(domain);
    const trustScore = displayTrustScoreForResult(result);
    const titleSegment = domainLandingTitleSegment(domain);
    const description = domainLandingMetaDescription(domain, trustScore, result.reviewSummary);

    const extraKeywords = [
      `is ${domain} legit`,
      `is ${domain} a scam`,
      `${domain} trust`,
      `${domain} website check`,
      "phishing website checker",
      "suspicious website detection"
    ] as const;

    return {
      title: titleSegment,
      description,
      keywords: [...defaultKeywords, ...extraKeywords],
      alternates: { canonical },
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        url: canonical,
        title: `${titleSegment} | Fraudly`,
        description,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: `${titleSegment} | Fraudly`,
        description,
        images: [OG_IMAGE.url]
      },
      robots: publicRobots
    };
  } catch {
    return {
      title: `Trust intelligence: ${domain}`,
      description: SEO_DESCRIPTION.domainIntelFallback,
      alternates: { canonical },
      robots: publicRobots
    };
  }
}

export default async function DomainIntelPage({ params }: PageProps) {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) notFound();

  const path = domainPathname(domain);
  let result;
  try {
    result = await getCachedWebsiteAnalysis(domain);
  } catch {
    notFound();
  }

  const trustScore = displayTrustScoreForResult(result);
  const faqs = domainLandingFaq(domain);
  const { lead, supporting } = domainLandingIntro(domain);
  const titleSegment = domainLandingTitleSegment(domain);
  const ogDescription = domainLandingMetaDescription(domain, trustScore, result.reviewSummary);
  const checkPath = `/check/${encodeURIComponent(domain)}`;

  const sslShort = result.ssl.httpsEnabled
    ? result.ssl.validCertificate
      ? "HTTPS available — encrypts transit, does not prove legitimacy"
      : "HTTPS with certificate issues"
    : "No HTTPS";

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <DomainIntelLandingJsonLd
        domain={domain}
        pathname={path}
        pageName={titleSegment}
        pageDescription={ogDescription}
        faqs={faqs}
      />
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
              <Link href="/learn" className="font-medium text-blue-600 hover:underline">
                Learn — scams &amp; phishing
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-slate-900">{domain}</li>
          </ol>
        </nav>

        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Website trust intelligence</p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{titleSegment}</h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">{lead}</p>
          <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">{supporting}</p>
        </header>

        <section className="mt-6 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-amber-950">
          <p>
            <strong className="font-semibold">Context, not certainty.</strong> Fraudly summarizes signals from public scam
            intelligence, phishing heuristics, and technical lookups. Fraudsters rotate infrastructure quickly—combine this page
            with official support channels before high-value decisions.
          </p>
        </section>

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust-style score</dt>
            <dd className="mt-1 text-2xl font-bold text-slate-900">
              {trustScore === null ? EN_MESSAGES.siteOutcome.suppressedTrustMeter : `${trustScore} / 100`}
            </dd>
          </div>
          <div className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain age</dt>
            <DomainAgeMetricValue
              {...result}
              debug={{ route: "/domain/[domain]", domain }}
            />
          </div>
          <div className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Secure connection</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{formatSslHighlightValue(result.ssl)}</dd>
          </div>
        </dl>

        <section className="mt-10 scroll-mt-20" aria-labelledby="domain-intel-faq-heading">
          <h2 id="domain-intel-faq-heading" className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            Common questions before you trust {domain}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Fraudly aligns with informational searches—“is this site legit?”—without pretending to adjudicate legitimacy in a legal
            sense. Use each answer alongside the scan below.
          </p>
          <div className="mt-6 space-y-3">
            {faqs.map((f) => (
              <details key={f.question} className="rounded-2xl border border-slate-200/85 bg-white p-4 shadow-subtle md:p-5">
                <summary className="cursor-pointer list-none text-left text-base font-semibold text-slate-900">{f.question}</summary>
                <p className="mt-3 text-left text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="fraudly-domain-analysis" className="mt-12 max-w-4xl scroll-mt-24">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">Structured scan &amp; evidence</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Expand sections for technical receipts, phishing-adjacent language cues, corroborating sources, reviews when
            reachable, and limitations of each data feed.
          </p>
          <div className="mt-6">
            <ResultCard result={result} />
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200/85 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-subtle md:p-6">
          <p className="font-semibold text-slate-900">Compact snapshot URL</p>
          <p className="mt-2">
            Prefer sharing a shorter branded path? Fraudly exposes the identical cached analysis via{" "}
            <Link href={checkPath} className="font-semibold text-blue-600 underline decoration-blue-600/35 underline-offset-2">
              {SITE_URL.replace(/^https:\/\//, "")}
              {checkPath}
            </Link>
            . Both URLs read the same data layer with separate editorial framing tuned for clarity vs. evergreen sharing.
          </p>
        </section>

        <section className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap" aria-label="Next steps">
          <Link href="/#link-check" className="btn-primary px-8 text-center">
            Run a fresh homepage check
          </Link>
          <Link href="/latest-checks" className="btn-secondary px-8 text-center">
            Latest public checks
          </Link>
          <Link href="/how-it-works" className="btn-secondary px-8 text-center">
            How Fraudly works
          </Link>
          <Link href="/scam-alerts" className="btn-secondary px-8 text-center">
            Threat alerts feed
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
