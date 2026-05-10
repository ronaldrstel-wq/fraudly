import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/about",
  titleSegment: "About Fraudly",
  description:
    "Fraudly helps consumers quietly vet websites—mixing phishing intelligence, SSL checks, domain history, review signals, and AI-assisted summaries without the hype."
});

const pillars = [
  {
    title: "Built for skeptical shoppers",
    body: "We focus on phishing sites, bogus stores, and social ad scams—the places people lose money in minutes."
  },
  {
    title: "Signals you can inspect",
    body: "Every check cites the technical, reputation, and intelligence context we could reach so nothing feels like a black box."
  },
  {
    title: "Fast by design",
    body: "No installs or lengthy questionnaires—paste a URL, read the takeaway, optionally open deep scans when you want more proof."
  }
] as const;

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8 ${className}`}>
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <header className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            About Fraudly
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Helping people pause before risky clicks</h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
            Fraudly gives consumers a grounded second opinion on unfamiliar websites—before purchases, banking logins, or sharing
            personal details—using calm language and understandable signals.
          </p>
        </header>

        <div className="mt-10 space-y-8 sm:mt-12 md:mt-14 md:space-y-10">
          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Why Fraudly exists</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">
              Online scams keep evolving—fake storefronts powered by slick ads, copycat banking portals, phishing DMs, and shady
              marketplaces. Most people simply need a trustworthy nudge plus enough detail to act wisely. Fraudly combines
              human-readable guidance with optional deep scan technology so curiosity does not mean clicking blind.
            </p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">How we approach trust</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">
              We fuse website trust signals with scam indicators, SSL posture, WHOIS clues, curated intelligence feeds,
              lightweight review probes, richer reputation enrichment when it succeeds, and AI-assisted narration. Nothing is
              perfect—coverage gaps happen—so every screen encourages independent verification before high-stakes actions.
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
              {pillars.map((pillar) => (
                <li key={pillar.title} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                  <p className="font-semibold text-slate-900">{pillar.title}</p>
                  <p className="mt-2 text-slate-600">{pillar.body}</p>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard className="border-amber-200/80 bg-amber-50/50">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Honest limits</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">
              Fraudly will never promise perfect accuracy—the web changes too quickly. Treat each result as situational awareness:
              combine it with issuer warnings, banking apps, retailer support chats, or people you trust in real life whenever the
              stakes are high.
            </p>
          </SectionCard>
        </div>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-md shadow-slate-200/50 sm:mt-14 md:mt-16">
          <p className="text-base font-medium text-slate-900">Have a questionable link?</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            Run a Fraudly check
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
