import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { CheckResultCardSkeleton, CheckSummarySkeleton } from "@/components/check/CheckResultSkeleton";
import { SiteFooter } from "@/components/SiteFooter";

export default function CheckDomainLoading() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <nav className="text-sm text-slate-600" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-x-2 gap-y-1">
            <li>
              <Link href="/" className="font-medium text-blue-600 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-slate-400">Loading…</li>
          </ol>
        </nav>
        <header className="mt-8 max-w-3xl">
          <p className="text-sm font-medium text-blue-700">Website trust check</p>
          <div className="mt-2 h-10 w-4/5 max-w-xl animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-4 h-16 w-full animate-pulse rounded-lg bg-slate-100" />
        </header>
        <CheckSummarySkeleton />
        <CheckResultCardSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}
