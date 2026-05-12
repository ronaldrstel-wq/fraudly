import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { SupportFaqJsonLd } from "@/components/support/SupportFaqJsonLd";
import { SUPPORT_FAQ_ITEMS } from "@/lib/support/supportFaq";
import { OG_IMAGE } from "@/lib/seo-metadata";
import { defaultKeywords, publicRobots, SITE_URL } from "@/lib/seo";

const PAGE_TITLE = "Fraudly Support & FAQ";
const PAGE_DESCRIPTION =
  "Get help with Fraudly website safety checks, trust scores, scam detection, phishing analysis, and frequently asked questions.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  keywords: [...defaultKeywords],
  robots: publicRobots,
  alternates: { canonical: `${SITE_URL}/support` },
  openGraph: {
    type: "website",
    siteName: "Fraudly",
    locale: "en_US",
    url: `${SITE_URL}/support`,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [OG_IMAGE.url]
  }
};

const SUPPORT_EMAIL = "support@fraudly.app";

const quickHelpCards = [
  {
    title: "Website Safety Checks",
    body: "Learn how URL checks, SSL signals, and reputation snapshots help you decide before you click or pay.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: "Scam Detection",
    body: "How we combine scam intelligence feeds, patterns, and AI-assisted summaries into a clear readout.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: "Trust Scores",
    body: "Trust scores blend technical and reputation indicators—they are guidance, not proof a site is safe or unsafe.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: "Account & Login",
    body: "Sign in to save history, sync devices, and access limits described on pricing—contact us if sign-in fails.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: "Report a Problem",
    body: "Wrong result, broken page, or billing issue? Email us with the URL and what you expected—we read every message.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    title: "Privacy & Data",
    body: "See how we handle cookies, analytics, and personal data in our Privacy Policy and cookie preferences.",
    icon: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <rect x="5" y="11" width="14" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15v2M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
] as const;

function ShieldIllustration() {
  return (
    <div className="pointer-events-none absolute -right-4 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-blue-200/90 sm:block md:right-8 md:h-48 md:w-48" aria-hidden>
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full">
        <defs>
          <linearGradient id="support-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(59 130 246 / 0.35)" />
            <stop offset="100%" stopColor="rgb(139 92 246 / 0.25)" />
          </linearGradient>
        </defs>
        <path
          d="M60 8 20 28v32c0 24 16 44 40 52 24-8 40-28 40-52V28L60 8Z"
          fill="url(#support-shield-grad)"
          stroke="rgb(59 130 246 / 0.45)"
          strokeWidth="1.5"
        />
        <path d="M45 58 55 68 78 45" stroke="rgb(37 99 235 / 0.6)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function SupportPage() {
  return (
    <>
      <SupportFaqJsonLd />
      <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
        <Navbar />

        <main>
          {/* Hero */}
          <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-br from-white via-slate-50/90 to-blue-50/40">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgba(59,130,246,0.12),transparent)]" aria-hidden />
            <ShieldIllustration />
            <div className="relative mx-auto w-full max-w-4xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-12 md:pt-16">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Help center</p>
              <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Support &amp; FAQ</h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 md:text-lg">
                Need help using Fraudly or have questions about website safety checks, scam detection, or your account? We&apos;re
                here to help.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email support</p>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="fraudly-focus mt-2 inline-flex text-lg font-semibold text-blue-700 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">We aim to respond within 48 hours.</p>
                </div>
                <div className="flex flex-col justify-center rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/80 to-violet-50/50 p-5 shadow-[0_8px_30px_rgba(59,130,246,0.08)]">
                  <p className="text-sm font-medium text-slate-800">Quick links</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li>
                      <Link href="/how-it-works" className="fraudly-focus font-medium text-blue-700 underline-offset-2 hover:underline">
                        How it works
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="fraudly-focus font-medium text-blue-700 underline-offset-2 hover:underline">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/disclaimer" className="fraudly-focus font-medium text-blue-700 underline-offset-2 hover:underline">
                        Disclaimer
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Quick help */}
          <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-14 md:py-16" aria-labelledby="quick-help-heading">
            <h2 id="quick-help-heading" className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Quick help
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
              Jump to common topics. For anything else, email us—we read every message.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickHelpCards.map((card) => (
                <article
                  key={card.title}
                  className="fraudly-motion group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-subtle transition duration-200 hover:border-slate-300/90 hover:shadow-[0_12px_34px_rgba(15,23,42,0.08)]"
                >
                  <div className="inline-flex rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-2.5 text-blue-700">
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
                </article>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-slate-200/70 bg-white/60 py-12 sm:py-14 md:py-16" aria-labelledby="faq-heading">
            <div className="mx-auto w-full max-w-3xl px-4">
              <h2 id="faq-heading" className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Frequently asked questions
              </h2>
              <p className="mt-2 text-sm text-slate-600 md:text-base">Clear answers about Fraudly, trust scores, and your data.</p>

              <div className="mt-8 space-y-3">
                {SUPPORT_FAQ_ITEMS.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-2xl border border-slate-200/80 bg-white shadow-subtle open:border-slate-300/80 open:shadow-[0_8px_28px_rgba(15,23,42,0.07)]"
                  >
                    <summary className="fraudly-focus flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-4 text-left text-sm font-semibold text-slate-900 marker:content-none md:px-5 md:text-base [&::-webkit-details-marker]:hidden">
                      <span className="pr-2">{item.question}</span>
                      <span
                        className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                        aria-hidden
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </summary>
                    <div className="border-t border-slate-100 px-4 pb-4 pt-0 text-sm leading-relaxed text-slate-600 md:px-5 md:text-[0.9375rem]">
                      <p className="pt-3">{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-12" aria-labelledby="disclaimer-heading">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-6 shadow-subtle sm:p-8">
              <h2 id="disclaimer-heading" className="text-lg font-bold text-slate-900">
                Important Disclaimer
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 md:text-base">
                Fraudly provides informational analysis only and does not provide legal, financial, cybersecurity, or professional
                advice. Always verify important transactions and websites independently.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-[#F9FAFB] py-12 sm:py-14">
            <div className="mx-auto max-w-3xl px-4 text-center">
              <h2 className="text-lg font-bold text-slate-900 md:text-xl">Still need help?</h2>
              <p className="mt-2 text-sm text-slate-600 md:text-base">
                Send us the URL, what you tried, and what went wrong—we&apos;ll get back as soon as we can.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=Fraudly%20support%20request`}
                className="fraudly-focus mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition duration-200 hover:brightness-110"
              >
                Email {SUPPORT_EMAIL}
              </a>
              <p className="mt-6">
                <Link href="/" className="fraudly-focus text-sm font-semibold text-blue-700 underline-offset-2 hover:underline">
                  Run a website check
                </Link>
              </p>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
