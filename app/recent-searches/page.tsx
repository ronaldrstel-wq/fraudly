import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { Navbar } from "@/components/Navbar";
import { RecentSearchesDashboard } from "@/components/RecentSearchesDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { getCheckPageLocale } from "@/lib/i18n/check-page-locale";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { listRecentSearchesForScope } from "@/lib/recent-search/service";
import { getRecentSearchesUi } from "@/lib/i18n/recent-searches-ui";
import { buildPageMetadata } from "@/lib/seo-metadata";
import { unindexedFollowRobots } from "@/lib/seo";
import { getBillingUserOrNull } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getCheckPageLocale();
  const ui = getRecentSearchesUi(locale);
  return {
    ...buildPageMetadata({
      path: "/recent-searches",
      titleSegment: ui.seoTitle,
      description: ui.seoDescription,
      robots: unindexedFollowRobots
    }),
    robots: unindexedFollowRobots
  };
}

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

  const locale = await getCheckPageLocale();
  const dict = getDictionary(locale);
  const ui = dict.recentSearchesUi;

  return (
    <LocaleProvider locale={locale} dict={dict}>
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
          {hadLoadError ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {ui.pageServerLoadError}
            </div>
          ) : null}
          <RecentSearchesDashboard initialItems={initialItems} />
        </main>
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}
