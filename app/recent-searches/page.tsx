import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { RecentSearchesDashboard } from "@/components/RecentSearchesDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { listRecentSearchesForScope } from "@/lib/recent-search/service";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { unindexedFollowRobots } from "@/lib/seo";
import { getBillingUserOrNull } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: "/recent-searches",
    titleSegment: SEO_TITLE.recentSearches,
    description: SEO_DESCRIPTION.recentSearches,
    robots: unindexedFollowRobots
  }),
  robots: unindexedFollowRobots
};

export default async function RecentSearchesPage() {
  let user: Awaited<ReturnType<typeof getBillingUserOrNull>> = null;
  try {
    user = await getBillingUserOrNull();
  } catch (e) {
    console.error("[recent-searches page] user lookup failed", e);
  }

  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/recent-searches")}`);
  }

  let initialItems: Awaited<ReturnType<typeof listRecentSearchesForScope>> = [];
  let hadLoadError = false;
  try {
    initialItems = await listRecentSearchesForScope({
      userId: user.id,
      anonymousSessionKey: null
    });
  } catch (e) {
    hadLoadError = true;
    console.error("[recent-searches page] list failed", e);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        {hadLoadError ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            We couldn&apos;t load your recent searches right now. Please refresh and try again.
          </div>
        ) : null}
        <RecentSearchesDashboard initialItems={initialItems} />
      </main>
      <SiteFooter />
    </div>
  );
}
