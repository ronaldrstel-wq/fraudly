import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function ScamAlertsLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-9 max-w-md animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-3 h-16 max-w-2xl animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-8 h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
