import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Navbar } from "@/components/Navbar";
import { RecentSearchesDashboard } from "@/components/RecentSearchesDashboard";
import { SiteFooter } from "@/components/SiteFooter";
import { RECENT_SEARCH_SESSION_COOKIE } from "@/lib/recent-search/constants";
import { listRecentSearchesForScope } from "@/lib/recent-search/service";
import { getBillingUserOrNull } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recent searches",
  description: "Your private Fraudly fraud-check history.",
  robots: { index: false, follow: true }
};

export default async function RecentSearchesPage() {
  const user = await getBillingUserOrNull();
  const jar = await cookies();
  const cookieAnon = jar.get(RECENT_SEARCH_SESSION_COOKIE)?.value?.trim() || null;

  const initialItems = await listRecentSearchesForScope({
    userId: user?.id ?? null,
    anonymousSessionKey: user?.id ? null : cookieAnon
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <RecentSearchesDashboard initialItems={initialItems} signedIn={Boolean(user)} />
      </main>
      <SiteFooter />
    </div>
  );
}
