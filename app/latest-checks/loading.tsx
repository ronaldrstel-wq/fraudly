import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function LatestChecksLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:pt-10 md:pt-14">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" aria-hidden />
        <div className="mt-3 h-9 max-w-xl animate-pulse rounded bg-slate-200" aria-hidden />
        <div className="mt-4 h-20 max-w-2xl animate-pulse rounded bg-slate-200/80" aria-hidden />
        <div className="mt-10 space-y-3" aria-busy aria-label="Loading latest checks">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
