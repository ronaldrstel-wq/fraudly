import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">This page could not be found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The link may be broken or the page may have been removed. Try the homepage or run a link check.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
        >
          Back to Fraudly
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
