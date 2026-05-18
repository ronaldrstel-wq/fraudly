import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ReportingLinkCard } from "@/components/scam-help/ReportingLinkCard";
import { ScamHelpCTA } from "@/components/scam-help/ScamHelpCTA";
import { ScamHelpDisclaimer } from "@/components/scam-help/ScamHelpDisclaimer";
import { ScamHelpFaqJsonLd } from "@/components/scam-help/ScamHelpFaqJsonLd";
import { ScamHelpInternalLinks } from "@/components/scam-help/ScamHelpInternalLinks";
import {
  getScamHelpCountryBySlug,
  SCAM_HELP_COUNTRY_SLUGS,
  SCAM_HELP_IMMEDIATE_ACTIONS,
  scamHelpCountryPath
} from "@/lib/scam-help/countries";
import { buildPageMetadata } from "@/lib/seo-metadata";

type PageProps = { params: Promise<{ country: string }> };

export function generateStaticParams() {
  return SCAM_HELP_COUNTRY_SLUGS.map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps) {
  const { country: slug } = await params;
  const country = getScamHelpCountryBySlug(slug);
  if (!country?.detail) {
    return { title: "Scam help", robots: { index: false, follow: false } };
  }
  return buildPageMetadata({
    path: scamHelpCountryPath(slug),
    titleSegment: country.detail.title,
    description: country.detail.description
  });
}

export default async function ScamHelpCountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const country = getScamHelpCountryBySlug(slug);
  if (!country?.detail) notFound();

  const detail = country.detail;
  const path = scamHelpCountryPath(country.slug);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <ScamHelpFaqJsonLd faqs={detail.faqs} path={path} />
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="mx-auto max-w-3xl text-center">
          <Link href="/scam-help" className="mb-4 inline-flex text-sm font-medium text-blue-600 hover:underline">
            ← Scam help (all countries)
          </Link>
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            <span aria-hidden>{country.code}</span>
            <span>{country.name}</span>
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            What to do if you were scammed in {country.name}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
            {detail.intro}
          </p>
          <div className="mt-6">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
            >
              Check a suspicious website
            </Link>
          </div>
        </header>

        <section className="mt-12 sm:mt-14" aria-labelledby="immediate-actions-heading">
          <h2 id="immediate-actions-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            Immediate actions
          </h2>
          <ul className="mt-6 space-y-3">
            {SCAM_HELP_IMMEDIATE_ACTIONS.map((action) => (
              <li
                key={action}
                className="flex gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-md shadow-slate-200/50 sm:px-5"
              >
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800"
                  aria-hidden
                >
                  ✓
                </span>
                {action}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 sm:mt-14" aria-labelledby="reporting-links-heading">
          <h2 id="reporting-links-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            Official reporting links
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {country.reportingLinks.map((link) => (
              <li key={link.name}>
                <ReportingLinkCard link={link} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 sm:mt-14" aria-labelledby="common-scams-heading">
          <h2 id="common-scams-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            Common scam types in {country.name}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detail.commonScams.map((scam) => (
              <li
                key={scam}
                className="rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-sm font-medium text-amber-950"
              >
                {scam}
              </li>
            ))}
          </ul>
        </section>

        <ScamHelpCTA className="mt-12 sm:mt-14" title="Check the website before you pay" />

        <section className="mt-12 sm:mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-slate-900 md:text-2xl">
            Frequently asked questions
          </h2>
          <dl className="mt-6 space-y-4">
            {detail.faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-md shadow-slate-200/50 sm:p-6"
              >
                <dt className="text-base font-semibold text-slate-900">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <ScamHelpDisclaimer className="mt-10" />

        <div className="mt-10">
          <ScamHelpInternalLinks />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
