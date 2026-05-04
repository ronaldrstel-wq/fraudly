import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "How it works — Fraudly",
  description:
    "Learn how Fraudly checks websites using trust signals, reviews, patterns, and AI before you click or buy."
};

const steps = [
  {
    title: "Paste a website link",
    text: "Enter the URL of a webshop, brand, or unknown website you want to check."
  },
  {
    title: "We scan trust signals",
    text: "Fraudly checks signals like domain patterns, public reviews, website content, shipping clues, and business transparency."
  },
  {
    title: "AI explains the risk",
    text: "Our AI summarizes the findings in plain language, so you understand why a website looks safe, suspicious, or risky."
  },
  {
    title: "Get a clear trust score",
    text: "You receive an easy-to-read trust score, verdict, and reasons to help you decide what to do next."
  }
] as const;

const signalCards = [
  {
    title: "Public reviews",
    text: "Google review ratings and review counts help identify established businesses."
  },
  {
    title: "Website patterns",
    text: "We look for suspicious wording, unusual domains, fake urgency, and unclear business information."
  },
  {
    title: "Shipping & supply chain",
    text: "Fraudly checks for clues of dropshipping, long delivery times, or China-linked fulfillment."
  },
  {
    title: "Business transparency",
    text: "Clear contact details, return policies, VAT/KvK signals, and local business information increase trust."
  },
  {
    title: "AI risk summary",
    text: "AI combines the findings and explains the result in understandable language."
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
            How Fraudly checks a website
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 md:text-lg">
            Fraudly analyzes public trust signals, review data, website patterns, and AI risk indicators to help you
            spot suspicious links before you buy or share personal details.
          </p>
          <div className="mt-8">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Try it free
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">Step by step</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            From paste to a clear readout — here is what happens when you run a check.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">What Fraudly looks at</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-600">
            Multiple layers of public and on-page signals feed your trust score and summary.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {signalCards.map((card) => (
              <article
                key={card.title}
                className="rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60"
              >
                <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl sm:mt-16 md:mt-20">
          <article className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-6 shadow-md shadow-amber-100/50 md:p-8">
            <h2 className="text-lg font-bold text-slate-900 md:text-xl">Fraudly is a risk assistant, not a guarantee</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
              No automated tool can guarantee that a website is 100% safe or unsafe. Fraudly helps you make a
              better-informed decision by highlighting signals that are often associated with trustworthy or suspicious
              websites.
            </p>
          </article>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
