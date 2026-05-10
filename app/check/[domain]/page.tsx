import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCachedWebsiteAnalysis } from "@/lib/analysis/cachedAnalysis";
import { parseCheckDomainParam } from "@/lib/domainPage";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { SITE_URL } from "@/lib/seo";
import { Navbar } from "@/components/Navbar";
import { ResultCard } from "@/components/ResultCard";
import { SiteFooter } from "@/components/SiteFooter";
import { DomainCheckJsonLd } from "@/components/seo/DomainCheckJsonLd";
import { EN_MESSAGES } from "@/lib/messages.en";
import { displayTrustScoreForResult } from "@/lib/scanPresentation";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ domain: string }>;
};

function safeDescription(domain: string, trustScore: number | null, summary: string): string {
  const trustPhrase =
    trustScore === null
      ? `Fraudly could not grade ${domain} as an active verified website—the trust gauge is withheld.`
      : `Trust-style score around ${trustScore}/100.`;
  const base = `See whether ${domain} shows scam indicators, phishing risks, suspicious patterns, or trust signals—with Fraudly’s website trust check. ${trustPhrase}`;
  const combined = `${base} ${summary}`;
  return combined.length > 158 ? `${combined.slice(0, 155)}…` : combined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) {
    return { title: "Website check", robots: { index: false, follow: true } };
  }

  const path = `/check/${encodeURIComponent(domain)}`;
  const canonical = `${SITE_URL}${path}`;

  try {
    const result = await getCachedWebsiteAnalysis(domain);
    const trustScore = displayTrustScoreForResult(result);
    const title = `Is ${domain} Safe? Website Trust Analysis`;
    const description = safeDescription(domain, trustScore, result.reviewSummary);

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        siteName: "Fraudly",
        locale: "en_US",
        url: canonical,
        title: `${title} | Fraudly`,
        description:
          trustScore === null
            ? `Fraudly checked ${domain} for scam signals. Trust-style score withheld — ${EN_MESSAGES.specialOutcomes.nonexistent.headline.toLowerCase()}.`
            : `Fraudly checked ${domain} for scam signals and website trust indicators. Trust-style score about ${trustScore}/100.`,
        images: [OG_IMAGE]
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Fraudly`,
        description: `Fraudly checked ${domain} for scam signals and website trust indicators.`,
        images: [OG_IMAGE.url]
      },
      robots: { index: true, follow: true }
    };
  } catch {
    return {
      title: `Website check: ${domain}`,
      description: `Run a website trust and scam-signal check for ${domain} with Fraudly.`,
      alternates: { canonical },
      robots: { index: true, follow: true }
    };
  }
}

export default async function DomainCheckPage({ params }: PageProps) {
  const { domain: raw } = await params;
  const domain = parseCheckDomainParam(raw);
  if (!domain) notFound();

  const path = `/check/${encodeURIComponent(domain)}`;
  let result;
  try {
    result = await getCachedWebsiteAnalysis(domain);
  } catch {
    notFound();
  }

  const trustScore = displayTrustScoreForResult(result);
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
          <ResultCard result={result} />
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
