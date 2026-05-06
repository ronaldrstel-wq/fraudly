import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { RecentSearchesDashboard } from "@/components/RecentSearchesDashboard";
import { SiteFooter } from "@/components/SiteFooter";
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
  if (!user) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/recent-searches")}`);
  }

  const initialItems = await listRecentSearchesForScope({
    userId: user.id,
    anonymousSessionKey: null
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <RecentSearchesDashboard initialItems={initialItems} />
      </main>
      <SiteFooter />
    </div>
  );
}
