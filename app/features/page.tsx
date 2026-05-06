import Link from "next/link";
import { FeatureInfoCard } from "@/components/FeatureInfoCard";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo-metadata";

export const metadata = buildPageMetadata({
  path: "/features",
  titleSegment: "Fraudly Features — Website Scam & Trust Checks",
  description:
    "Learn how Fraudly helps detect scam websites, phishing risks, and suspicious online stores using trust and security analysis."
});

const features = [
  {
    title: "Domain Age Analysis",
    description: "Recently created domains are often used in scams and fake stores.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 3v6l4 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    title: "SSL & Security Checks",
    description: "Checks HTTPS, certificates, and basic security setup.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M7 11V8a5 5 0 1110 0v3m-9 0h8a1 1 0 011 1v6a1 1 0 01-1 1H8a1 1 0 01-1-1v-6a1 1 0 011-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    title: "Scam Signal Detection",
    description: "Detects suspicious patterns commonly found on phishing and fraudulent websites.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4zm0 5v5m0 3h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    title: "Reputation Signals",
    description: "Analyzes trust indicators and website credibility.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M12 17l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8L12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    title: "Contact & Transparency Checks",
    description: "Looks for missing business information and suspicious website structure.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M4 6h16v12H4zM8 10h8M8 14h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    title: "AI Risk Summary",
    description: "Summarizes the overall trustworthiness in plain language.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M12 3l2.5 5.2L20 10l-4 4 .9 5.5L12 17l-4.9 2.5L8 14l-4-4 5.5-1.8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
] as const;

const useCases = [
  "Before buying from an unknown webshop",
  "Checking links from social media or ads",
  "Verifying marketplace sellers",
  "Avoiding phishing websites",
  "Helping friends or family stay safe online"
] as const;

const faqs = [
  {
    q: "Is Fraudly free?",
    a: "You can check one website for free without an account."
  },
  {
    q: "Do I need to install anything?",
    a: "No, everything works directly in your browser."
  },
  {
    q: "Does Fraudly guarantee a website is safe?",
    a: "No tool can guarantee safety, but Fraudly helps identify common risk signals and suspicious patterns."
  },
  {
    q: "Can I check multiple websites?",
    a: "Yes, create a free account to continue checking websites."
  }
] as const;

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-14 md:pt-16">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Check if a website is safe before you trust it
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-slate-600 md:text-lg">
            Fraudly analyzes websites for scam signals, domain risks, suspicious behavior, and trust indicators in
            seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:brightness-110"
            >
              Check a website
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              See how it works
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">What Fraudly checks</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureInfoCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">Why people use Fraudly</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <article key={useCase} className="rounded-xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
                <p className="text-sm font-medium text-slate-800">{useCase}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-slate-200/60 sm:mt-16 md:mt-20 md:p-8">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">How it works</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Paste a website URL",
              "Fraudly analyzes risk signals",
              "Get a clear trust overview instantly"
            ].map((step, index) => (
              <li key={step} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-medium text-slate-800">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link
              href="/#link-check"
              className="inline-flex rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition duration-200 hover:brightness-110"
            >
              Try your free website check
            </Link>
          </div>
        </section>

        <section className="mt-14 sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">Example result preview</h2>
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">Checked domain</p>
              <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Needs caution</p>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">example-shop-security-check.com</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trust score</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">58 / 100</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain age</p>
                <p className="mt-1 text-base font-semibold text-slate-900">3 months</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">SSL status</p>
                <p className="mt-1 text-base font-semibold text-emerald-700">HTTPS active</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scam indicators</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Urgency language, limited contact details</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">AI summary</p>
              <p className="mt-1 text-sm text-blue-900">
                The website has a valid secure connection, but the domain is very new and key business transparency
                details are limited. Review carefully before sharing payment or personal information.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-3xl sm:mt-16 md:mt-20">
          <h2 className="text-center text-xl font-bold text-slate-900 md:text-2xl">FAQ</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">{faq.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
