import Link from "next/link";
import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import {
  fetchPublicCheckLinkItems,
  fetchTrendingPublicCheckLinkItems
} from "@/lib/seo/public-check-links";

const LATEST_LIMIT = 16;
const TRENDING_LIMIT = 8;

export async function HomePublicChecksDiscovery() {
  const latest = await fetchPublicCheckLinkItems(LATEST_LIMIT);
  const trending = await fetchTrendingPublicCheckLinkItems(
    TRENDING_LIMIT,
    latest.map((l) => l.domain)
  );

  if (latest.length === 0 && trending.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl space-y-8 sm:mt-12">
      {latest.length > 0 ? (
        <InternalCheckLinksSection
          id="home-latest-checks"
          title="Latest website safety checks"
          description="Recent public trust snapshots from the Fraudly community feed. Each link opens a full safety report for that domain."
          items={latest}
          footerHref="/latest-checks"
          footerLabel="Browse all latest checks →"
        />
      ) : null}

      {trending.length > 0 ? (
        <InternalCheckLinksSection
          id="home-trending-checks"
          title="Trending high-risk checks"
          description="Recently flagged domains with lower trust scores—worth a closer look before you shop or share payment details."
          items={trending}
          compact
          footerHref="/latest-checks"
          footerLabel="See more on latest checks →"
        />
      ) : null}

      <p className="text-center text-xs text-slate-500">
        Explore{" "}
        <Link href="/scam-alerts" className="font-medium text-blue-600 hover:underline">
          scam alerts
        </Link>{" "}
        and our{" "}
        <Link href="/website-scam-checker" className="font-medium text-blue-600 hover:underline">
          website scam checker
        </Link>{" "}
        guides for more context.
      </p>
    </div>
  );
}
