import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export type SeoToolPageProps = {
  h1: string;
  intro: string;
  children?: ReactNode;
  bullets?: readonly string[];
  relatedLinks: readonly { href: string; label: string }[];
};

export function SeoToolPage({ h1, intro, children, bullets, relatedLinks }: SeoToolPageProps) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-10 sm:pt-14 md:pt-16">
        <article className="rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{h1}</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg">{intro}</p>

          {bullets && bullets.length > 0 && (
            <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-700 md:text-base">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}

          {children}

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
            <p className="text-sm font-medium text-slate-900">Try the free checker</p>
            <p className="mt-1 text-sm text-slate-600">
              Paste a URL on the homepage to run a quick trust and risk review — no signup required.
            </p>
            <Link
              href="/#link-check"
              className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              Open Fraudly checker
            </Link>
          </div>

          <nav className="mt-8 border-t border-slate-100 pt-6" aria-label="Related topics">
            <p className="text-sm font-semibold text-slate-900">Related pages</p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {relatedLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="font-medium text-blue-600 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>

        <p className="mt-8 text-center text-sm text-slate-600">
          <Link href="/" className="font-medium text-blue-600 hover:underline">
            ← Back to Fraudly
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
