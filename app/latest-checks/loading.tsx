import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function LatestChecksLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:pt-10 md:pt-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="mx-auto h-5 w-48 max-w-full animate-pulse rounded bg-slate-200 lg:mx-0" aria-hidden />
            <div className="mx-auto mt-3 h-10 max-w-xl animate-pulse rounded bg-slate-200 lg:mx-0" aria-hidden />
            <div className="mx-auto mt-5 h-16 max-w-2xl animate-pulse rounded bg-slate-200/80 lg:mx-0" aria-hidden />
            <div className="mx-auto mt-3 h-10 max-w-xl animate-pulse rounded bg-slate-200/60 lg:mx-0" aria-hidden />
          </div>
          <div className="mx-auto h-52 w-full max-w-sm animate-pulse rounded-[1.35rem] bg-slate-200/90 sm:h-60 lg:max-w-md" aria-hidden />
        </div>
        <div className="mt-12 space-y-4 md:mt-14" aria-busy aria-label="Loading latest checks">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[9.25rem] animate-pulse rounded-[20px] border border-slate-200/90 border-l-[7px] border-l-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/40 shadow-sm sm:h-[9.5rem]"
            />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
