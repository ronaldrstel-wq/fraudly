import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { EN_MESSAGES } from "@/lib/messages.en";

export default function RecentSearchesLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-2/3 max-w-md rounded-lg bg-slate-200" />
          <div className="h-4 w-full max-w-xl rounded bg-slate-200" />
          <div className="h-4 w-full max-w-lg rounded bg-slate-200" />
          <div className="mt-8 h-44 rounded-2xl bg-slate-200" />
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">{EN_MESSAGES.recentSearches.loading}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
