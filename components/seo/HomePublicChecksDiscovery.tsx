import Link from "next/link";
import { HomeIntelligencePreview } from "@/components/seo/HomeIntelligencePreview";
import { InternalCheckLinksSection } from "@/components/seo/InternalCheckLinksSection";
import { fetchPublicCheckLinkItems } from "@/lib/seo/public-check-links";

const LATEST_LIMIT = 16;

export async function HomePublicChecksDiscovery() {
  const latest = await fetchPublicCheckLinkItems(LATEST_LIMIT);

  if (latest.length === 0) {
    return (
      <div className="mx-auto mt-10 w-full max-w-6xl sm:mt-12">
        <HomeIntelligencePreview />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl space-y-8 sm:mt-12">
      <InternalCheckLinksSection
        id="home-latest-checks"
        title="Latest website safety checks"
        description="Recent public trust snapshots from the Fraudly community feed. Each link opens a full safety report for that domain."
        items={latest}
        footerHref="/latest-checks"
        footerLabel="Browse all latest checks →"
      />

      <HomeIntelligencePreview />

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
