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
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";
import { marketingBadgeClass, marketingPageH1Class, marketingPrimaryCtaClass } from "@/lib/i18n/typography";

export async function ScamHelpPageView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const headersList = await headers();
  const detectedCode = detectCountryFromHeaders(headersList);
  const countrySummaries = SCAM_HELP_COUNTRIES.map(toCountrySummary);
  const t = dict.scamHelp;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar locale={locale} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="mx-auto max-w-3xl text-center">
          <div className={`mx-auto mb-4 ${marketingBadgeClass(locale)}`}>{t.badge}</div>
          <h1 className={marketingPageH1Class(locale, "large")}>{t.title}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">{t.subtitle}</p>
          <div className="mt-6">
            <Link
              href={`${localizedPath("/", locale)}#link-check`}
              className={marketingPrimaryCtaClass(locale)}
            >
              {t.cta}
            </Link>
          </div>
        </header>

        <CountryAwareScamHelp detectedCountryCode={detectedCode} countries={countrySummaries} />

        <ScamHelpCTA className="mt-12 sm:mt-14" title={t.ctaSection} buttonLabel={t.ctaButton} />

        <ScamHelpDisclaimer className="mt-8" />

        <div className="mt-10">
          <ScamHelpInternalLinks />
        </div>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}
