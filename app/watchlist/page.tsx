import type { Metadata } from "next";
import { WatchlistDashboard } from "@/components/WatchlistDashboard";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { db } from "@/lib/db";
import { prismaWatchlistRowToApi } from "@/lib/watchlist/serialize-prisma";
import { getBillingUserOrNull } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Review websites and items you saved to watch in Fraudly.",
  robots: { index: false, follow: true }
};

export default async function WatchlistPage() {
  const user = await getBillingUserOrNull();

  const initialItems = user
    ? (await db.watchlistItem.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      })).map(prismaWatchlistRowToApi)
    : [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <WatchlistDashboard initialItems={initialItems} signedIn={Boolean(user)} />
      </main>
      <SiteFooter />
    </div>
  );
}
