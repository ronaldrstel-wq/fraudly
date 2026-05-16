import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SEO_DESCRIPTION, SEO_TITLE } from "@/lib/seo-description";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/how-it-works",
  titleSegment: SEO_TITLE.howItWorks,
  description: SEO_DESCRIPTION.howItWorks
});

const steps = [
  {
    title: "Submit a website",
    text: "Paste the link you are unsure about—before you buy, sign in, or follow a promo."
  },
  {
    title: "Technical analysis",
    text: "Fraudly gathers HTTPS and certificate context, domain lifecycle signals, and suspicious structure clues from the live site."
  },
  {
    title: "Reputation & scam intelligence",
    text: "Public reputation snapshots and curated scam feeds highlight brand-new hosts, impersonation patterns, and known-bad infrastructure when data is reachable."
  },
  {
    title: "AI-assisted evaluation",
    text: "Advanced heuristics (and optional AI notes) help spot risky combinations such as phishing wording, fake-shop flows, or weak trust anchors."
  },
  {
    title: "Risk summary",
    text: "Everything compresses into a trust score, headline guidance, and expandable detail so you can skim fast or dig deeper."
  }
] as const;

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-blue-100 bg-white px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm">
            How Fraudly works
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            From URL to calm, explainable guidance
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
            Fraudly is built for shoppers, not security engineers. Each check pairs fast technical probes with reputation
            snapshots, scam feeds, and thoughtful AI assistance so you can decide what to do next.
          </p>
          <div className="mt-8">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Check a website
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">The five-step pipeline</h2>
          <p className="mx-auto mt-2 max-w-2xl text-pretty text-center text-sm leading-relaxed text-slate-600">
            Every stage is designed to stay transparent: you always know what ran, what failed, and why the score moved.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <article className="flex h-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
                  <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mt-14 max-w-3xl sm:mt-16 md:mt-20">
          <article className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-6 shadow-md shadow-amber-100/50 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Fraudly supports judgment—it does not replace it</h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-700 md:text-base">
              Fraudly is designed to support safer online decisions by highlighting trustworthy and risky patterns—not by
              promising certainty. Combine the readout with your own instincts and official contacts whenever money or
              sensitive data is involved.
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
