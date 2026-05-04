import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/about",
  titleSegment: "About Fraudly",
  description:
    "What Fraudly is, why it exists, and how it helps you check suspicious links and websites before you click or buy."
});

const whatWeDoBullets = [
  "Checks public review data (like Google ratings)",
  "Detects suspicious website patterns and domain signals",
  "Identifies dropshipping and supply chain indicators",
  "Evaluates business transparency (addresses, policies, etc.)",
  "Uses AI to explain the results in plain language"
] as const;

function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8 ${className}`}
    >
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
            About us
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">About Fraudly</h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-relaxed text-slate-600 md:text-lg">
            Fraudly helps you check websites before you click, so you can avoid scams, fake shops, and risky links.
          </p>
        </header>

        <div className="mt-10 space-y-8 sm:mt-12 md:mt-14 md:space-y-10">
          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Our mission</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              Online scams are getting harder to spot. Fake webshops, phishing pages, and misleading offers are
              everywhere. Fraudly was built to give people a simple way to check if a website looks trustworthy before
              they share personal information or make a purchase.
            </p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">What Fraudly does</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              Fraudly analyzes multiple signals to estimate how trustworthy a website is. Instead of guessing, you get
              a clear explanation of what was found and what it means.
            </p>
            <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-700 md:text-base">
              {whatWeDoBullets.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Why we built this</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              Most people don’t have the time or knowledge to manually investigate every website. Fraudly simplifies that
              process into a fast, easy check you can use in seconds.
            </p>
          </SectionCard>

          <SectionCard className="border-amber-200/80 bg-amber-50/50">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Transparency matters</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              No tool can guarantee that a website is 100% safe or a scam. Fraudly highlights signals that are commonly
              associated with trustworthy or suspicious websites, so you can make a better-informed decision.
            </p>
          </SectionCard>

          <SectionCard>
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Built for users</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              Fraudly is designed to help users, not to manipulate them. We focus on clear explanations, honest scoring,
              and privacy-first design.
            </p>
            <p className="mt-4 text-xs text-slate-500 md:text-sm">We do not sell your personal data.</p>
          </SectionCard>
        </div>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white/90 px-6 py-8 text-center shadow-md shadow-slate-200/50 sm:mt-14 md:mt-16">
          <p className="text-base font-medium text-slate-900">Want to check a website?</p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          >
            Try it free
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
