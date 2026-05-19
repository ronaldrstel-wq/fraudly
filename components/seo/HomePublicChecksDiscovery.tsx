import Link from "next/link";
import { HomeIntelligencePreview } from "@/components/seo/HomeIntelligencePreview";
import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/paths";
import type { Locale } from "@/lib/i18n/locales";
import { fetchPublicCheckLinkItems } from "@/lib/seo/public-check-links";

const LATEST_LIMIT = 16;

type HomePublicChecksDiscoveryProps = {
  locale?: Locale;
};

export async function HomePublicChecksDiscovery({ locale = "en" }: HomePublicChecksDiscoveryProps) {
  const copy = getDictionary(locale).homeDiscovery;
  const latest = await fetchPublicCheckLinkItems(LATEST_LIMIT);

  if (latest.length === 0) {
    return (
      <div className="mx-auto mt-10 w-full max-w-6xl sm:mt-12">
        <HomeIntelligencePreview locale={locale} />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl space-y-8 sm:mt-12">
      <InternalCheckLinksSection
        id="home-latest-checks"
        title={copy.latestChecksTitle}
        description={copy.latestChecksDescription}
        items={latest}
        footerHref={localizedPath("/latest-checks", locale)}
        footerLabel={copy.browseAllLatestChecks}
      />

      <HomeIntelligencePreview locale={locale} />

      <p className="text-center text-xs text-slate-500">
        {copy.exploreFooterBefore}{" "}
        <Link href={localizedPath("/scam-alerts", locale)} className="font-medium text-blue-600 hover:underline">
          {copy.exploreScamAlertsLink}
        </Link>{" "}
        {copy.exploreFooterMiddle}{" "}
        <Link href="/website-scam-checker" className="font-medium text-blue-600 hover:underline">
          {copy.exploreWebsiteScamCheckerLink}
        </Link>{" "}
        {copy.exploreFooterAfter}
      </p>
    </div>
  );
}
