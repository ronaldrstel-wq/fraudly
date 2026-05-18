import Link from "next/link";
import { headers } from "next/headers";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { CountryAwareScamHelp } from "@/components/scam-help/CountryAwareScamHelp";
import { ScamHelpCTA } from "@/components/scam-help/ScamHelpCTA";
import { ScamHelpDisclaimer } from "@/components/scam-help/ScamHelpDisclaimer";
import { ScamHelpInternalLinks } from "@/components/scam-help/ScamHelpInternalLinks";
import { detectCountryFromHeaders } from "@/lib/scam-help/detect-country";
import { SCAM_HELP_COUNTRIES, toCountrySummary } from "@/lib/scam-help/countries";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/scam-help",
  titleSegment: SEO_TITLE.scamHelp,
  description: SEO_DESCRIPTION.scamHelp
});

export default async function ScamHelpPage() {
  const headersList = await headers();
  const detectedCode = detectCountryFromHeaders(headersList);
  const countrySummaries = SCAM_HELP_COUNTRIES.map(toCountrySummary);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            Scam help — informational only
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Scammed or unsure what to do?
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
            Find official places to report scams and practical steps to protect yourself.
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

        <CountryAwareScamHelp detectedCountryCode={detectedCode} countries={countrySummaries} />

        <ScamHelpCTA className="mt-12 sm:mt-14" title="Check a website before you pay" />

        <ScamHelpDisclaimer className="mt-8" />

        <div className="mt-10">
          <ScamHelpInternalLinks />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
